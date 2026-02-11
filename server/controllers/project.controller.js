/**Models*/
import projectModel from '../models/project.model';
import roleModel from '../models/roles.model';
import listPreferencesModel from '../models/listPreferences.model.js';
/**Services*/
import projectService from '../services/project.service';
import EmailService from '../services/email.service'
import activityService from '../services/activity.service';
import exportToCsvViewService from '../services/exportToCsvViews.service.js';
/**Utils*/
import respUtil from '../utils/resp.util';
import serviceUtil from '../utils/service.util';
import i18nUtil from '../utils/i18n.util';
import sessionUtil from '../utils/session.util';
const emailService = new EmailService()
import config from '../config/config'
import _ from 'lodash';


const controller = "Project";

/**
 * Create new project
 * @param req
 * @param res
 * @returns { respCode: respCode, respMessage: respMessage }
 */
 async function register(req, res) {
    logger.info('Log:Project Controller:register: body :' + JSON.stringify(req.body), controller);
  
    await serviceUtil.checkPermission(req, res, "Edit", controller);
    if(req.body && req.body.email) req.body.email=req.body.email.toLowerCase()
    let project = new projectModel(req.body);
  
    //check email exists or not
    const uniqueEmail = await projectModel.findUniqueEmail(project.email);
    if (uniqueEmail) {
      req.i18nKey = 'emailExists';
      logger.error('Error:project Controller:register:' + i18nUtil.getI18nMessage('emailExists'), controller);
      return res.json(respUtil.getErrorResponse(req));
    }
    let requiredFieldError = await projectService.requriedFields(req)
    if(requiredFieldError){
      req.i18nKey = 'requriedField';
      return res.json(respUtil.getErrorResponse(req));
    }
    
    /*replace_*validateFieldData*/
    project = await projectService.setCreateProjectVariables(req, project)

    /**@create ListPreference for individual login type */
    let newListPreference = await new listPreferencesModel({columnOrder:config.columnOrder,projectId:project._id});
    /**@Saving the ListPreference */
    let savedPreference = await listPreferencesModel.saveData(newListPreference);
    /**@Assign that Preference to User */
    project.listPreferences = savedPreference._id;

    req.project = await projectModel.saveData(project);
    req.project.password = req.project.salt = undefined;
    req.entityType = 'project';
    req.activityKey = 'projectRegister';
    activityService.insertActivity(req);
    if (req.body.email) {
    emailService.sendEmailviaGrid({
        templateName: config.emailTemplates.projectCreate,
        entityType: sessionUtil.getLoginType(req),
        emailParams: {
            to: req.body.email
            // link: templateInfo.clientUrl + '#/changeRecoverPassword/' + req.token + '?active=true'
        }
    });
}
    //send email to project
    // emailService.sendEmail(req, res);
    // let templateInfo = JSON.parse(JSON.stringify(config.mailSettings));
    // emailService.sendEmailviaGrid({
    //   templateName: config.emailTemplates.projectWelcome,
    //   emailParams: {
    //     to: project.email,
    //     displayName: project.displayName,
    //     Id: req.project._id,
    //     link: templateInfo.adminUrl
    //   }
    // });
    logger.info('Log:project Controller:register:' + i18nUtil.getI18nMessage('projectCreate'), controller);
    return res.json(respUtil.createSuccessResponse(req));
  }
  
/**
 *  auth-multiDelete project.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function multidelete(req, res, next) {
  logger.info('Log:Project Controller:multidelete: query,body :' + JSON.stringify(req.query, req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  if (req.body && req.body.selectedIds && req.body.selectedIds.length > 0) {
    const validation = await checkOwnRecordIdExists(req);
    if (validation.isError) {
      return res.json(respUtil.getErrorResponse(req));
    }
    await projectModel.updateMany(
      { _id: { $in: req.body.selectedIds } },
      {
        $set: {
          active: false,
          updated: new Date()
        }
      },
      { multi: true }
    );
  }
  req.entityType = 'project';
  req.activityKey = 'projectDelete';
  // adding project delete activity
  activityService.insertActivity(req);
  res.json(respUtil.removeSuccessResponse(req));
};

/**
 * checkOwnRecordExists
 * @param {*} req 
 * @returns+
 */
async function checkOwnRecordIdExists(req) {
  for (let selectedId of req.body.selectedIds) {
    if (req.tokenInfo && req.tokenInfo._id.toString() == selectedId.toString()) {
      req.i18nKey = "reqUnAuthorized";
      return { isError: true }
    }
  }
  return { isError: false }
}

/**
 * Get project
 * @param req
 * @param res
 * @returns {details: Project}
 */
async function get(req, res) {
  logger.info('Log:Project Controller:get: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  res.json({
    details: req.project
  });
}// import { Project } from "mocha";


/**
 * Get project list. based on criteria
 * @param req
 * @param res
 * @param next
 * @returns {projects: projects, pagination: pagination}
 */
async function list(req, res, next) {
  let projects
  logger.info('Log:Project Controller:list: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  const query = await serviceUtil.generateListQuery(req,"project");  
  // if (req.tokenInfo && req.tokenInfo._doc._id && req.tokenInfo._doc.role && req.tokenInfo._doc.role != 'Admin') {
  //   query.filter.createdBy = req.tokenInfo._id
  // }
  let roleDetails = {}
  if (req.tokenInfo && req.tokenInfo._doc && req.tokenInfo._doc.role) {
    roleDetails = await roleModel.findOne({ role: req.tokenInfo._doc.role, active:true })
  }
  if (!req.query.searchFrom) {
    if (req.tokenInfo && req.tokenInfo._doc && req.tokenInfo._doc._id && roleDetails && roleDetails.roleType && roleDetails.roleType === "Employee") {
      // query.filter.createdBy = req.tokenInfo._doc._id
      query.filter["$or"] = [{ createdBy: { $in: [req.tokenInfo._doc._id] } }, { createdByName: { $in: [req.tokenInfo._doc._id] }},{ teamMembers: { $in: [req.tokenInfo._doc._id] }},];
    } else if (req.tokenInfo && req.tokenInfo._doc && req.tokenInfo._doc._id && roleDetails && roleDetails.roleType && roleDetails.roleType === "Manager") {
      let level = 0
      roleDetails.levels ? level = roleDetails.levels : level = 1;
      if (level >= 2) {
        level = level - 1;
        let reportingMembersArray = [req.tokenInfo._doc._id]
        level = level - 1;
        let reportingMembers = await projectModel.find({ reportingTo: req.tokenInfo._doc._id }, { _id: 1 });
        for (let obj of reportingMembers) {
          reportingMembersArray.push(obj._id);
        }
        if (level > 0) {
          var flag = true
          while (flag) {
            if (reportingMembers && reportingMembers.length > 0) {
              let value1 = await projectService.getEmployees(reportingMembers)
              reportingMembersArray = [...reportingMembersArray, ...value1];
              reportingMembers = JSON.parse(JSON.stringify(value1));
            } else {
              flag = false;
            }
            level = level - 1;
            level == 0 ? flag = false : null
          }
        }
        if (reportingMembersArray.length > 0) {
          // query.filter.reportingTo = { $in: reportingMembersArray };
          query.filter["$or"] = [{ reportingTo: { $in: reportingMembersArray } }, { createdByName: { $in: [req.tokenInfo._doc._id] }},{ teamMembers: { $in: [req.tokenInfo._doc._id] }},];
        }
      } else {
        // query.filter.reportingTo = req.tokenInfo._doc._id //ofor Employee crud
        query.filter["$or"] = [{ reportingTo: { $in: [req.tokenInfo._doc._id] } }, { createdByName: { $in: [req.tokenInfo._doc._id] }},{ teamMembers: { $in: [req.tokenInfo._doc._id] }},];
      }
    }
  }
  req.entityType = 'project';
  query.dbfields = { password: 0, salt: 0, _v: 0 };
  if (req.query.type === 'exportToCsv') {
    query.limit = (query.pagination.totalCount>200) ? 200 : query.pagination.totalCount
  }

  projects = await projectModel.list(query);
  if (req.query.type === 'exportToCsv') {
    projects = await exportToCsvViewService.applyCsvHashingToActions(req, projects);
  }
  query.pagination.totalCount = await projectModel.totalCount(query);

  res.json({
    projects: projects,
    pagination: query.pagination
  });
}


/**
 * Load project and append to req.
 * @param req
 * @param res
 * @param next
 */
async function load(req, res, next) {
  try{
    req.project = await projectModel.get(req.params.projectId);
    return next();
  }catch(err){
    req.i18nKey="idNotFound"
    return res.json(respUtil.getErrorResponse(req))
  }
}

/**
 * Create new project
 * @param req
 * @param res
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function create(req, res) {
  logger.info('Log:Project Controller:create: body :' + JSON.stringify(req.body), controller);

  await serviceUtil.checkPermission(req, res, "Edit", controller);
  if(req.body && req.body.email) req.body.email=req.body.email.toLowerCase()
  let project = new projectModel(req.body);
  let preCreateResult = await preCreate(project)
  //check email exists or not
  const uniqueEmail = await projectModel.findUniqueEmail(project.email);
  if (uniqueEmail) {
    req.i18nKey = 'emailExists';
    logger.error('Error:project Controller:create:' + i18nUtil.getI18nMessage('emailExists'), controller);
    return res.json(respUtil.getErrorResponse(req));
  }
  let requiredFieldError = await projectService.requriedFields(req)
  if(requiredFieldError){
    req.i18nKey = 'requriedField';
    return res.json(respUtil.getErrorResponse(req));
  }
  
  
  project = await projectService.setCreateProjectVariables(req, project)
  let validateRes = await projectService.validateFields(req, req.body);
              if(validateRes){
              return res.json(respUtil.getErrorResponse(req));
            }

  /**@create ListPreference for individual login type */
  let newListPreference = await new listPreferencesModel({columnOrder:config.columnOrder,projectId:project._id});
  /**@Saving the ListPreference */
  let savedPreference = await listPreferencesModel.saveData(newListPreference);
  /**@Assign that Preference to User */
  project.listPreferences = savedPreference._id;

  let preSaveCreateResult = await preSaveCreate(project)
  req.project = await projectModel.saveData(project);
  let postSaveCreateResult = await postSaveCreate(req.project)
  req.project.password = req.project.salt = undefined;
  req.entityType = 'project';
  req.activityKey = 'projectCreate';
  activityService.insertActivity(req);
  if (req.body.email) {
    emailService.sendEmailviaGrid({
        templateName: config.emailTemplates.projectCreate,
        entityType: sessionUtil.getLoginType(req),
        emailParams: {
            to: req.body.email
            // link: templateInfo.clientUrl + '#/changeRecoverPassword/' + req.token + '?active=true'
        }
    });
}
  //send email to project
  // emailService.sendEmail(req, res);
  // let templateInfo = JSON.parse(JSON.stringify(config.mailSettings));
  // emailService.sendEmailviaGrid({
  //   templateName: config.emailTemplates.projectWelcome,
  //   emailParams: {
  //     to: project.email,
  //     displayName: project.displayName,
  //     Id: req.project._id,
  //     link: templateInfo.adminUrl
  //   }
  // });
  logger.info('Log:project Controller:create:' + i18nUtil.getI18nMessage('projectCreate'), controller);
  return res.json(respUtil.createSuccessResponse(req));
}


/**
 * Update existing project
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function update(req, res, next) {
  logger.info('Log:Project Controller:update: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let project = req.project;
  let preUpdateResult = await preUpdate(project)
  
  req.description = await serviceUtil.compareObjects(project, req.body);
  project = Object.assign(project, req.body);
  // project = _.merge(project, req.body);
  // project.set(req.body);
  project = await projectService.setUpdateProjectVariables(req, project);
  let validateRes = await projectService.validateFields(req, req.body);
              if(validateRes){
              return res.json(respUtil.getErrorResponse(req));
            }
  let preSaveUpdateResult = await preSaveUpdate(project)
  req.project = await projectModel.saveData(project);
  let postSaveUpdateResult = await postSaveUpdate(req.project)
  req.entityType = 'project';
  req.activityKey = 'projectUpdate';

  // adding project update activity
  activityService.insertActivity(req);
  res.json(respUtil.updateSuccessResponse(req));
}

/**
 * Delete project.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function remove(req, res, next) {
  logger.info('Log:Project Controller:remove: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let project = req.project;
  let preRemoveResult = await preRemove(project)
  project.active = false;
  project = await projectService.setUpdateProjectVariables(req, project);
  let preSaveRemoveResult = await preSaveRemove(project)
  req.project = await projectModel.saveData(project);
  let postSaveRemoveResult = await postSaveRemove(req.project)
  req.entityType = 'project';
  req.activityKey = 'projectDelete';

  // adding project delete activity
  activityService.insertActivity(req);
  res.json(respUtil.removeSuccessResponse(req));
};

/**
 * multiupdate
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
async function multiupdate(req,res,next){
    logger.info('Log:Project Controller:multiupdate: query,body :' + JSON.stringify(req.body));
    await serviceUtil.checkPermission(req, res, "Edit", controller);
    if(req.body && req.body.selectedIds && req.body.selectedIds.length > 0  && req.body.updatedDetails){
      await projectModel.updateMany({ 
        _id:{ $in : req.body.selectedIds }
        },
        { $set: req.body.updatedDetails }
      )
    }
    req.entityType = 'project';
    req.activityKey = 'projectUpdate';
    activityService.insertActivity(req);
    res.json(respUtil.updateSuccessResponse(req));
  }

 const preCreate=async(project)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveCreate=async(project)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveCreate=async(project)=>{
    /**@Add Your custom Logic */
}
const preUpdate=async(project)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveUpdate=async(project)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveUpdate=async(project)=>{
    /**@Add Your custom Logic */
}
const preRemove=async(project)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveRemove=async(project)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveRemove=async(project)=>{
    /**@Add Your custom Logic */
}


export default {register,multidelete,get,list,load,create,update,remove,multiupdate}