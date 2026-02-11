/**Models*/
import agentModel from '../models/agent.model.js';
import roleModel from '../models/roles.model.js';
import listPreferencesModel from '../models/listPreferences.model.js';
/**Services*/
import agentService from '../services/agent.service.js';
import EmailService from '../services/email.service.js'
import activityService from '../services/activity.service.js';
import exportToCsvViewService from '../services/exportToCsvViews.service.js';
/**Utils*/
import respUtil from '../utils/resp.util.js';
import serviceUtil from '../utils/service.util.js';
import i18nUtil from '../utils/i18n.util.js';
import sessionUtil from '../utils/session.util.js';
const emailService = new EmailService()
import config from '../config/config.js'
import _ from 'lodash';


const controller = "Agent";

/**
 * Create new agent
 * @param req
 * @param res
 * @returns { respCode: respCode, respMessage: respMessage }
 */
 async function register(req, res) {
    logger.info('Log:Agent Controller:register: body :' + JSON.stringify(req.body), controller);
  
    await serviceUtil.checkPermission(req, res, "Edit", controller);
    if(req.body && req.body.email) req.body.email=req.body.email.toLowerCase()
    let agent = new agentModel(req.body);
  
    //check email exists or not
    const uniqueEmail = await agentModel.findUniqueEmail(agent.email);
    if (uniqueEmail) {
      req.i18nKey = 'emailExists';
      logger.error('Error:agent Controller:register:' + i18nUtil.getI18nMessage('emailExists'), controller);
      return res.json(respUtil.getErrorResponse(req));
    }
    let requiredFieldError = await agentService.requriedFields(req)
    if(requiredFieldError){
      req.i18nKey = 'requriedField';
      return res.json(respUtil.getErrorResponse(req));
    }
    
    /*replace_*validateFieldData*/
    agent = await agentService.setCreateAgentVariables(req, agent)

    /**@create ListPreference for individual login type */
    let newListPreference = await new listPreferencesModel({columnOrder:config.columnOrder,agentId:agent._id});
    /**@Saving the ListPreference */
    let savedPreference = await listPreferencesModel.saveData(newListPreference);
    /**@Assign that Preference to User */
    agent.listPreferences = savedPreference._id;

    req.agent = await agentModel.saveData(agent);
    req.agent.password = req.agent.salt = undefined;
    req.entityType = 'agent';
    req.activityKey = 'agentRegister';
    activityService.insertActivity(req);
    if (req.body.email) {
    emailService.sendEmailviaGrid({
        templateName: config.emailTemplates.agentCreate,
        entityType: sessionUtil.getLoginType(req),
        emailParams: {
            to: req.body.email
            // link: templateInfo.clientUrl + '#/changeRecoverPassword/' + req.token + '?active=true'
        }
    });
}
    //send email to agent
    // emailService.sendEmail(req, res);
    // let templateInfo = JSON.parse(JSON.stringify(config.mailSettings));
    // emailService.sendEmailviaGrid({
    //   templateName: config.emailTemplates.agentWelcome,
    //   emailParams: {
    //     to: agent.email,
    //     displayName: agent.displayName,
    //     Id: req.agent._id,
    //     link: templateInfo.adminUrl
    //   }
    // });
    logger.info('Log:agent Controller:register:' + i18nUtil.getI18nMessage('agentCreate'), controller);
    return res.json(respUtil.createSuccessResponse(req));
  }
  
/**
 *  auth-multiDelete agent.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function multidelete(req, res, next) {
  logger.info('Log:Agent Controller:multidelete: query,body :' + JSON.stringify(req.query, req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  if (req.body && req.body.selectedIds && req.body.selectedIds.length > 0) {
    const validation = await checkOwnRecordIdExists(req);
    if (validation.isError) {
      return res.json(respUtil.getErrorResponse(req));
    }
    await agentModel.updateMany(
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
  req.entityType = 'agent';
  req.activityKey = 'agentDelete';
  // adding agent delete activity
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
 * Get agent
 * @param req
 * @param res
 * @returns {details: Agent}
 */
async function get(req, res) {
  logger.info('Log:Agent Controller:get: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  res.json({
    details: req.agent
  });
}// import { Agent } from "mocha";


/**
 * Get agent list. based on criteria
 * @param req
 * @param res
 * @param next
 * @returns {agents: agents, pagination: pagination}
 */
async function list(req, res, next) {
  let agents
  logger.info('Log:Agent Controller:list: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  const query = await serviceUtil.generateListQuery(req,"agent");  
  // if (req.tokenInfo && req.tokenInfo._doc._id && req.tokenInfo._doc.role && req.tokenInfo._doc.role != 'Admin') {
  //   query.filter.createdBy = req.tokenInfo._id
  // }
  let roleDetails = {}
  if (req.tokenInfo && req.tokenInfo._doc && req.tokenInfo._doc.role) {
    roleDetails = await roleModel.findOne({ role: req.tokenInfo._doc.role, active:true })
  }
  if (!req.query.searchFrom) {
    if (req.tokenInfo && req.tokenInfo._doc && req.tokenInfo._doc._id && roleDetails && roleDetails.roleType && roleDetails.roleType === "Agent") {
      // query.filter.createdBy = req.tokenInfo._doc._id
      query.filter["$or"] = [{ createdBy: { $in: [req.tokenInfo._doc._id] } }, ];
    } else if (req.tokenInfo && req.tokenInfo._doc && req.tokenInfo._doc._id && roleDetails && roleDetails.roleType && roleDetails.roleType === "Manager") {
      let level = 0
      roleDetails.levels ? level = roleDetails.levels : level = 1;
      if (level >= 2) {
        level = level - 1;
        let reportingMembersArray = [req.tokenInfo._doc._id]
        level = level - 1;
        let reportingMembers = await agentModel.find({ reportingTo: req.tokenInfo._doc._id }, { _id: 1 });
        for (let obj of reportingMembers) {
          reportingMembersArray.push(obj._id);
        }
        if (level > 0) {
          var flag = true
          while (flag) {
            if (reportingMembers && reportingMembers.length > 0) {
              let value1 = await agentService.getAgents(reportingMembers)
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
          query.filter["$or"] = [{ reportingTo: { $in: reportingMembersArray } }, ];
        }
      } else {
        // query.filter.reportingTo = req.tokenInfo._doc._id //ofor Agent crud
        query.filter["$or"] = [{ reportingTo: { $in: [req.tokenInfo._doc._id] } }, ];
      }
    }
  }
  req.entityType = 'agent';
  query.dbfields = { password: 0, salt: 0, _v: 0 };
  if (req.query.type === 'exportToCsv') {
    query.limit = (query.pagination.totalCount>200) ? 200 : query.pagination.totalCount
  }

  agents = await agentModel.list(query);
  if (req.query.type === 'exportToCsv') {
    agents = await exportToCsvViewService.applyCsvHashingToActions(req, agents);
  }
  query.pagination.totalCount = await agentModel.totalCount(query);

  res.json({
    agents: agents,
    pagination: query.pagination
  });
}


/**
 * Load agent and append to req.
 * @param req
 * @param res
 * @param next
 */
async function load(req, res, next) {
  try{
    req.agent = await agentModel.get(req.params.agentId);
    return next();
  }catch(err){
    req.i18nKey="idNotFound"
    return res.json(respUtil.getErrorResponse(req))
  }
}

/**
 * Create new agent
 * @param req
 * @param res
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function create(req, res) {
  logger.info('Log:Agent Controller:create: body :' + JSON.stringify(req.body), controller);

  await serviceUtil.checkPermission(req, res, "Edit", controller);
  if(req.body && req.body.email) req.body.email=req.body.email.toLowerCase()
  let agent = new agentModel(req.body);
  let preCreateResult = await preCreate(agent)
  //check email exists or not
  const uniqueEmail = await agentModel.findUniqueEmail(agent.email);
  if (uniqueEmail) {
    req.i18nKey = 'emailExists';
    logger.error('Error:agent Controller:create:' + i18nUtil.getI18nMessage('emailExists'), controller);
    return res.json(respUtil.getErrorResponse(req));
  }
  let requiredFieldError = await agentService.requriedFields(req)
  if(requiredFieldError){
    req.i18nKey = 'requriedField';
    return res.json(respUtil.getErrorResponse(req));
  }
  
  
  agent = await agentService.setCreateAgentVariables(req, agent)
  let validateRes = await agentService.validateFields(req, req.body);
              if(validateRes){
              return res.json(respUtil.getErrorResponse(req));
            }

  /**@create ListPreference for individual login type */
  let newListPreference = await new listPreferencesModel({columnOrder:config.columnOrder,agentId:agent._id});
  /**@Saving the ListPreference */
  let savedPreference = await listPreferencesModel.saveData(newListPreference);
  /**@Assign that Preference to User */
  agent.listPreferences = savedPreference._id;

  let preSaveCreateResult = await preSaveCreate(agent)
  req.agent = await agentModel.saveData(agent);
  let postSaveCreateResult = await postSaveCreate(req.agent)
  req.agent.password = req.agent.salt = undefined;
  req.entityType = 'agent';
  req.activityKey = 'agentCreate';
  activityService.insertActivity(req);
  if (req.body.email) {
    emailService.sendEmailviaGrid({
        templateName: config.emailTemplates.agentCreate,
        entityType: sessionUtil.getLoginType(req),
        emailParams: {
            to: req.body.email
            // link: templateInfo.clientUrl + '#/changeRecoverPassword/' + req.token + '?active=true'
        }
    });
}
  //send email to agent
  // emailService.sendEmail(req, res);
  // let templateInfo = JSON.parse(JSON.stringify(config.mailSettings));
  // emailService.sendEmailviaGrid({
  //   templateName: config.emailTemplates.agentWelcome,
  //   emailParams: {
  //     to: agent.email,
  //     displayName: agent.displayName,
  //     Id: req.agent._id,
  //     link: templateInfo.adminUrl
  //   }
  // });
  logger.info('Log:agent Controller:create:' + i18nUtil.getI18nMessage('agentCreate'), controller);
  return res.json(respUtil.createSuccessResponse(req));
}


/**
 * Update existing agent
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function update(req, res, next) {
  logger.info('Log:Agent Controller:update: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let agent = req.agent;
  let preUpdateResult = await preUpdate(agent)
  
  req.description = await serviceUtil.compareObjects(agent, req.body);
  agent = Object.assign(agent, req.body);
  // agent = _.merge(agent, req.body);
  // agent.set(req.body);
  agent = await agentService.setUpdateAgentVariables(req, agent);
  let validateRes = await agentService.validateFields(req, req.body);
              if(validateRes){
              return res.json(respUtil.getErrorResponse(req));
            }
  let preSaveUpdateResult = await preSaveUpdate(agent)
  req.agent = await agentModel.saveData(agent);
  let postSaveUpdateResult = await postSaveUpdate(req.agent)
  req.entityType = 'agent';
  req.activityKey = 'agentUpdate';

  // adding agent update activity
  activityService.insertActivity(req);
  res.json(respUtil.updateSuccessResponse(req));
}

/**
 * Delete agent.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function remove(req, res, next) {
  logger.info('Log:Agent Controller:remove: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let agent = req.agent;
  let preRemoveResult = await preRemove(agent)
  agent.active = false;
  agent = await agentService.setUpdateAgentVariables(req, agent);
  let preSaveRemoveResult = await preSaveRemove(agent)
  req.agent = await agentModel.saveData(agent);
  let postSaveRemoveResult = await postSaveRemove(req.agent)
  req.entityType = 'agent';
  req.activityKey = 'agentDelete';

  // adding agent delete activity
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
    logger.info('Log:Agent Controller:multiupdate: query,body :' + JSON.stringify(req.body));
    await serviceUtil.checkPermission(req, res, "Edit", controller);
    if(req.body && req.body.selectedIds && req.body.selectedIds.length > 0  && req.body.updatedDetails){
      await agentModel.updateMany({ 
        _id:{ $in : req.body.selectedIds }
        },
        { $set: req.body.updatedDetails }
      )
    }
    req.entityType = 'agent';
    req.activityKey = 'agentUpdate';
    activityService.insertActivity(req);
    res.json(respUtil.updateSuccessResponse(req));
  }

 const preCreate=async(agent)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveCreate=async(agent)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveCreate=async(agent)=>{
    /**@Add Your custom Logic */
}
const preUpdate=async(agent)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveUpdate=async(agent)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveUpdate=async(agent)=>{
    /**@Add Your custom Logic */
}
const preRemove=async(agent)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveRemove=async(agent)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveRemove=async(agent)=>{
    /**@Add Your custom Logic */
}


export default {register,multidelete,get,list,load,create,update,remove,multiupdate}