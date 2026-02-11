/**Models*/
import voterModel from '../models/voter.model.js';
import projectsModel from '../models/project.model.js';
import listPreferencesModel from '../models/listPreferences.model.js';
import roleModel from '../models/roles.model.js';
/**Services*/
import voterService from '../services/voter.service.js';
import projectService from '../services/project.service.js';
import activityService from '../services/activity.service.js';
import EmailService from '../services/email.service.js'
import exportToCsvViewService from '../services/exportToCsvViews.service.js'
/**Utils*/
import respUtil from '../utils/resp.util.js';
import serviceUtil from '../utils/service.util.js';
import i18nUtil from '../utils/i18n.util.js';
import sessionUtil from '../utils/session.util.js';
const emailService = new EmailService()
import config from '../config/config.js'
import _ from 'lodash';


const controller = "Voter";

/**
 *  multiDelete voter.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function multidelete(req, res, next) {
  logger.info('Log:Voter Controller:multidelete: query,body :' + JSON.stringify(req.query, req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  if (req.body && req.body.selectedIds && req.body.selectedIds.length > 0) {
    await voterModel.updateMany(
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
  req.entityType = 'voter';
  req.activityKey = 'voterDelete';
  // adding voter delete activity
  activityService.insertActivity(req);
  res.json(respUtil.removeSuccessResponse(req));
};

/**
 * Get voter
 * @param req
 * @param res
 * @returns {details: Voter}
 */
async function get(req, res) {
  logger.info('Log:Voter Controller:get: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  res.json({
    details: req.voter
  });
}// import { Voter } from "mocha";


/**
 * Get voter list. based on criteria
 * @param req
 * @param res
 * @param next
 * @returns {voters: voters, pagination: pagination}
 */
async function list(req, res, next) {
  let voters
  logger.info('Log:Voter Controller:list: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  const query = await serviceUtil.generateListQuery(req,"voter");  
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
  req.entityType = 'voter';
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
  //   voters = await Voter.aggregate(query)

  // } else {
  query.dbfields = { password: 0, salt: 0, _v: 0 };
  if (req.query.type === 'exportToCsv') {
    query.limit = (query.pagination.totalCount>200) ? 200 : query.pagination.totalCount
  }
  voters = await voterModel.list(query); // textLowerCasePlural
  // }
  if (req.query.type === 'exportToCsv') {
      voters = await exportToCsvViewService.applyCsvHashingToActions(req, voters);
  }
  query.pagination.totalCount = await voterModel.totalCount(query);
  res.json({
    voters: voters,
    pagination: query.pagination
  });
}


/**
 * Load voter and append to req.
 * @param req
 * @param res
 * @param next
 */
async function load(req, res, next) {
  try{
    req.voter = await voterModel.get(req.params.voterId);
    return next();
  }catch(err){
    req.i18nKey="idNotFound"
    return res.json(respUtil.getErrorResponse(req))
  }
}

/**
 * Create new voter
 * @param req
 * @param res
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function create(req, res) {
  logger.info('Log:Voter Controller:create: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let voter = new voterModel(req.body); // voter // VoterFirst
  let preCreateResult = await preCreate(voter)
  
  
  voter = await voterService.setCreateVoterVariables(req, voter);
  let preSaveCreateResult = await preSaveCreate(voter)
  req.voter = await voterModel.saveData(voter);
  let postSaveCreateResult = await postSaveCreate(req.voter)
  req.entityType = 'voter';
  req.activityKey = 'voterCreate';
  
  // adding voter create activity
  activityService.insertActivity(req);
  res.json(respUtil.createSuccessResponse(req));
}

/**
 * Update existing voter
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function update(req, res, next) {
  logger.info('Log:Voter Controller:update: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let voter = req.voter;
  let preUpdateResult = await preUpdate(voter)
  
  req.description = await serviceUtil.compareObjects(voter, req.body);
  voter = Object.assign(voter, req.body);
  // voter = _.merge(voter, req.body);
  // voter.set(req.body);
  voter = await voterService.setUpdateVoterVariables(req, voter);
  
  let preSaveUpdateResult = await preSaveUpdate(voter)
  req.voter = await voterModel.saveData(voter);
  let postSaveUpdateResult = await postSaveUpdate(req.voter)
  req.entityType = 'voter';
  req.activityKey = 'voterUpdate';

  // adding voter update activity
  activityService.insertActivity(req);
  res.json(respUtil.updateSuccessResponse(req));
}

/**
 * Delete voter.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function remove(req, res, next) {
  logger.info('Log:Voter Controller:remove: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let voter = req.voter;
  let preRemoveResult = await preRemove(voter)
  voter.active = false;
  voter = await voterService.setUpdateVoterVariables(req, voter);
  let preSaveRemoveResult = await preSaveRemove(voter)
  req.voter = await voterModel.saveData(voter);
  let postSaveRemoveResult = await postSaveRemove(req.voter)
  req.entityType = 'voter';
  req.activityKey = 'voterDelete';

  // adding voter delete activity
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
    logger.info('Log:Voter Controller:multiupdate: query,body :' + JSON.stringify(req.body));
    await serviceUtil.checkPermission(req, res, "Edit", controller);
    if(req.body && req.body.selectedIds && req.body.selectedIds.length > 0  && req.body.updatedDetails){
      await voterModel.updateMany({ 
        _id:{ $in : req.body.selectedIds }
        },
        { $set: req.body.updatedDetails }
      )
    }
    req.entityType = 'voter';
    req.activityKey = 'voterUpdate';
    activityService.insertActivity(req);
    res.json(respUtil.updateSuccessResponse(req));
  }

 const preCreate=async(voter)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveCreate=async(voter)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveCreate=async(voter)=>{
    /**@Add Your custom Logic */
}
const preUpdate=async(voter)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveUpdate=async(voter)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveUpdate=async(voter)=>{
    /**@Add Your custom Logic */
}
const preRemove=async(voter)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveRemove=async(voter)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveRemove=async(voter)=>{
    /**@Add Your custom Logic */
}


export default {multidelete,get,list,load,create,update,remove,multiupdate}