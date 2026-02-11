/**Models*/
import partyModel from '../models/party.model.js';
import projectsModel from '../models/project.model.js';
import listPreferencesModel from '../models/listPreferences.model.js';
import roleModel from '../models/roles.model.js';
/**Services*/
import partyService from '../services/party.service.js';
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


const controller = "Party";

/**
 *  multiDelete party.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function multidelete(req, res, next) {
  logger.info('Log:Party Controller:multidelete: query,body :' + JSON.stringify(req.query, req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  if (req.body && req.body.selectedIds && req.body.selectedIds.length > 0) {
    await partyModel.updateMany(
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
  req.entityType = 'party';
  req.activityKey = 'partyDelete';
  // adding party delete activity
  activityService.insertActivity(req);
  res.json(respUtil.removeSuccessResponse(req));
};

/**
 * Get party
 * @param req
 * @param res
 * @returns {details: Party}
 */
async function get(req, res) {
  logger.info('Log:Party Controller:get: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  res.json({
    details: req.party
  });
}// import { Party } from "mocha";


/**
 * Get party list. based on criteria
 * @param req
 * @param res
 * @param next
 * @returns {partys: partys, pagination: pagination}
 */
async function list(req, res, next) {
  let partys
  logger.info('Log:Party Controller:list: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  const query = await serviceUtil.generateListQuery(req,"party");  
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
  req.entityType = 'party';
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
  //   partys = await Party.aggregate(query)

  // } else {
  query.dbfields = { password: 0, salt: 0, _v: 0 };
  if (req.query.type === 'exportToCsv') {
    query.limit = (query.pagination.totalCount>200) ? 200 : query.pagination.totalCount
  }
  partys = await partyModel.list(query); // textLowerCasePlural
  // }
  if (req.query.type === 'exportToCsv') {
      partys = await exportToCsvViewService.applyCsvHashingToActions(req, partys);
  }
  query.pagination.totalCount = await partyModel.totalCount(query);
  res.json({
    partys: partys,
    pagination: query.pagination
  });
}


/**
 * Load party and append to req.
 * @param req
 * @param res
 * @param next
 */
async function load(req, res, next) {
  try{
    req.party = await partyModel.get(req.params.partyId);
    return next();
  }catch(err){
    req.i18nKey="idNotFound"
    return res.json(respUtil.getErrorResponse(req))
  }
}

/**
 * Create new party
 * @param req
 * @param res
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function create(req, res) {
  logger.info('Log:Party Controller:create: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let party = new partyModel(req.body);
  let preCreateResult = await preCreate(party)
  
  
  party = await partyService.setCreatePartyVariables(req, party);
  let preSaveCreateResult = await preSaveCreate(party)
  req.party = await partyModel.saveData(party);
  let postSaveCreateResult = await postSaveCreate(req.party)
  req.entityType = 'party';
  req.activityKey = 'partyCreate';
  
  // adding party create activity
  activityService.insertActivity(req);
  res.json(respUtil.createSuccessResponse(req));
}

/**
 * Update existing party
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function update(req, res, next) {
  logger.info('Log:Party Controller:update: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let party = req.party;
  let preUpdateResult = await preUpdate(party)
  
  req.description = await serviceUtil.compareObjects(party, req.body);
  party = Object.assign(party, req.body);
  // party = _.merge(party, req.body);
  // party.set(req.body);
  party = await partyService.setUpdatePartyVariables(req, party);
  
  let preSaveUpdateResult = await preSaveUpdate(party)
  req.party = await partyModel.saveData(party);
  let postSaveUpdateResult = await postSaveUpdate(req.party)
  req.entityType = 'party';
  req.activityKey = 'partyUpdate';

  // adding party update activity
  activityService.insertActivity(req);
  res.json(respUtil.updateSuccessResponse(req));
}

/**
 * Delete party.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function remove(req, res, next) {
  logger.info('Log:Party Controller:remove: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let party = req.party;
  let preRemoveResult = await preRemove(party)
  party.active = false;
  party = await partyService.setUpdatePartyVariables(req, party);
  let preSaveRemoveResult = await preSaveRemove(party)
  req.party = await partyModel.saveData(party);
  let postSaveRemoveResult = await postSaveRemove(req.party)
  req.entityType = 'party';
  req.activityKey = 'partyDelete';

  // adding party delete activity
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
    logger.info('Log:Party Controller:multiupdate: query,body :' + JSON.stringify(req.body));
    await serviceUtil.checkPermission(req, res, "Edit", controller);
    if(req.body && req.body.selectedIds && req.body.selectedIds.length > 0  && req.body.updatedDetails){
      await partyModel.updateMany({ 
        _id:{ $in : req.body.selectedIds }
        },
        { $set: req.body.updatedDetails }
      )
    }
    req.entityType = 'party';
    req.activityKey = 'partyUpdate';
    activityService.insertActivity(req);
    res.json(respUtil.updateSuccessResponse(req));
  }

 const preCreate=async(party)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveCreate=async(party)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveCreate=async(party)=>{
    /**@Add Your custom Logic */
}
const preUpdate=async(party)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveUpdate=async(party)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveUpdate=async(party)=>{
    /**@Add Your custom Logic */
}
const preRemove=async(party)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveRemove=async(party)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveRemove=async(party)=>{
    /**@Add Your custom Logic */
}


export default {multidelete,get,list,load,create,update,remove,multiupdate}