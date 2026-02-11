/**Models*/
import leaveModel from '../models/leave.model';
import projectsModel from '../models/project.model';
import listPreferencesModel from '../models/listPreferences.model.js';
import roleModel from '../models/roles.model';
/**Services*/
import leaveService from '../services/leave.service';
import projectService from '../services/project.service';
import activityService from '../services/activity.service';
import EmailService from '../services/email.service'
import exportToCsvViewService from '../services/exportToCsvViews.service.js'
/**Utils*/
import respUtil from '../utils/resp.util';
import serviceUtil from '../utils/service.util';
import i18nUtil from '../utils/i18n.util';
import sessionUtil from '../utils/session.util';
const emailService = new EmailService()
import config from '../config/config'
import _ from 'lodash';


const controller = "Leave";

/**
 *  multiDelete leave.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function multidelete(req, res, next) {
  logger.info('Log:Leave Controller:multidelete: query,body :' + JSON.stringify(req.query, req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  if (req.body && req.body.selectedIds && req.body.selectedIds.length > 0) {
    await leaveModel.updateMany(
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
  req.entityType = 'leave';
  req.activityKey = 'leaveDelete';
  // adding leave delete activity
  activityService.insertActivity(req);
  res.json(respUtil.removeSuccessResponse(req));
};

/**
 * Get leave
 * @param req
 * @param res
 * @returns {details: Leave}
 */
async function get(req, res) {
  logger.info('Log:Leave Controller:get: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  res.json({
    details: req.leave
  });
}// import { Leave } from "mocha";


/**
 * Get leave list. based on criteria
 * @param req
 * @param res
 * @param next
 * @returns {leaves: leaves, pagination: pagination}
 */
async function list(req, res, next) {
  let leaves
  logger.info('Log:Leave Controller:list: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  const query = await serviceUtil.generateListQuery(req,"leave");  
  // if (req.tokenInfo && req.tokenInfo._doc._id && req.tokenInfo._doc.role && req.tokenInfo._doc.role != 'Admin') {
  //   query.filter.createdBy = req.tokenInfo._id
  // }
  let roleDetails = {}
  if (req.tokenInfo && req.tokenInfo._doc && req.tokenInfo._doc.role) {
    roleDetails = await roleModel.findOne({ role: req.tokenInfo._doc.role,active:true });
  }
  if (!req.query.searchFrom) {
    if (req.tokenInfo && req.tokenInfo._doc && req.tokenInfo._doc._id && roleDetails && roleDetails.roleType && roleDetails.roleType === "Employee") {
      // query.filter.createdBy = req.tokenInfo._doc._id
      query.filter["$or"] = [{ createdBy: { $in: [req.tokenInfo._doc._id] } }, { createdByName: { $in: [req.tokenInfo._doc._id] }},];
    } else if (req.tokenInfo && req.tokenInfo._doc && req.tokenInfo._doc._id && roleDetails && roleDetails.roleType && roleDetails.roleType === "Manager") {
      let level = 0
      roleDetails.levels ? level = roleDetails.levels : level = 1;
      if (level >= 2) {
        level = level - 1;
        let reportingMembersArray = [req.tokenInfo._doc._id]
        // level = level - 1;
        let reportingMembers = await projects.find({ reportingTo: req.tokenInfo._doc._id }, { _id: 1 });
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
          // query.filter.createdBy = { $in: reportingMembersArray };
          query.filter["$or"] = [{ createdBy: { $in: reportingMembersArray } }, { createdByName: { $in: [req.tokenInfo._doc._id] }},];
        }
      } else {
        // query.filter.createdBy = req.tokenInfo._doc._id //ofor Employee crud
        query.filter["$or"] = [{ createdBy: { $in: [req.tokenInfo._doc._id] } }, { createdByName: { $in: [req.tokenInfo._doc._id] }},];
      }
    }
  }
  req.entityType = 'leave';
  // if (req.tokenInfo.loginType === 'employee') {
  //   let query = [{
  //     $match: {
  //       active: true
  //     }
  //   },
  //   { $sort: { created: -1 } },
  //   {
  //     $addFields:
  //       showHide
  //     //  "name": { "$cond": [{ "$eq": ["$name.show", false] }, "$$REMOVE", "$name"] },

  //   },]
  //   leaves = await Leave.aggregate(query)

  // } else {
  query.dbfields = { password: 0, salt: 0, _v: 0 };
  if (req.query.type === 'exportToCsv') {
    query.limit = (query.pagination.totalCount>200) ? 200 : query.pagination.totalCount
  }
  leaves = await leaveModel.list(query); // textLowerCasePlural
  // }
  if (req.query.type === 'exportToCsv') {
      leaves = await exportToCsvViewService.applyCsvHashingToActions(req, leaves);
  }
  query.pagination.totalCount = await leaveModel.totalCount(query);
  res.json({
    leaves: leaves,
    pagination: query.pagination
  });
}


/**
 * Load leave and append to req.
 * @param req
 * @param res
 * @param next
 */
async function load(req, res, next) {
  try{
    req.leave = await leaveModel.get(req.params.leaveId);
    return next();
  }catch(err){
    req.i18nKey="idNotFound"
    return res.json(respUtil.getErrorResponse(req))
  }
}

/**
 * Create new leave
 * @param req
 * @param res
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function create(req, res) {
  logger.info('Log:Leave Controller:create: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let leave = new leaveModel(req.body); // leave // LeaveFirst
  let preCreateResult = await preCreate(leave)
  
  
  leave = await leaveService.setCreateLeaveVariables(req, leave);
  let preSaveCreateResult = await preSaveCreate(leave)
  req.leave = await leaveModel.saveData(leave);
  let postSaveCreateResult = await postSaveCreate(req.leave)
  req.entityType = 'leave';
  req.activityKey = 'leaveCreate';
  
  // adding leave create activity
  activityService.insertActivity(req);
  res.json(respUtil.createSuccessResponse(req));
}

/**
 * Update existing leave
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function update(req, res, next) {
  logger.info('Log:Leave Controller:update: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let leave = req.leave;
  let preUpdateResult = await preUpdate(leave)
  
  req.description = await serviceUtil.compareObjects(leave, req.body);
  leave = Object.assign(leave, req.body);
  // leave = _.merge(leave, req.body);
  // leave.set(req.body);
  leave = await leaveService.setUpdateLeaveVariables(req, leave);
  
  let preSaveUpdateResult = await preSaveUpdate(leave)
  req.leave = await leaveModel.saveData(leave);
  let postSaveUpdateResult = await postSaveUpdate(req.leave)
  req.entityType = 'leave';
  req.activityKey = 'leaveUpdate';

  // adding leave update activity
  activityService.insertActivity(req);
  res.json(respUtil.updateSuccessResponse(req));
}

/**
 * Delete leave.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function remove(req, res, next) {
  logger.info('Log:Leave Controller:remove: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let leave = req.leave;
  let preRemoveResult = await preRemove(leave)
  leave.active = false;
  leave = await leaveService.setUpdateLeaveVariables(req, leave);
  let preSaveRemoveResult = await preSaveRemove(leave)
  req.leave = await leaveModel.saveData(leave);
  let postSaveRemoveResult = await postSaveRemove(req.leave)
  req.entityType = 'leave';
  req.activityKey = 'leaveDelete';

  // adding leave delete activity
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
    logger.info('Log:Leave Controller:multiupdate: query,body :' + JSON.stringify(req.body));
    await serviceUtil.checkPermission(req, res, "Edit", controller);
    if(req.body && req.body.selectedIds && req.body.selectedIds.length > 0  && req.body.updatedDetails){
      await leaveModel.updateMany({ 
        _id:{ $in : req.body.selectedIds }
        },
        { $set: req.body.updatedDetails }
      )
    }
    req.entityType = 'leave';
    req.activityKey = 'leaveUpdate';
    activityService.insertActivity(req);
    res.json(respUtil.updateSuccessResponse(req));
  }

 const preCreate=async(leave)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveCreate=async(leave)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveCreate=async(leave)=>{
    /**@Add Your custom Logic */
}
const preUpdate=async(leave)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveUpdate=async(leave)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveUpdate=async(leave)=>{
    /**@Add Your custom Logic */
}
const preRemove=async(leave)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveRemove=async(leave)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveRemove=async(leave)=>{
    /**@Add Your custom Logic */
}


export default {multidelete,get,list,load,create,update,remove,multiupdate}