/**Models*/
import electionModel from '../models/election.model.js';
import projectsModel from '../models/project.model.js';
import listPreferencesModel from '../models/listPreferences.model.js';
import roleModel from '../models/roles.model.js';
/**Services*/
import electionService from '../services/election.service.js';
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


const controller = "Election";

/**
 *  multiDelete election.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function multidelete(req, res, next) {
  logger.info('Log:Election Controller:multidelete: query,body :' + JSON.stringify(req.query, req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  if (req.body && req.body.selectedIds && req.body.selectedIds.length > 0) {
    await electionModel.updateMany(
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
  req.entityType = 'election';
  req.activityKey = 'electionDelete';
  // adding election delete activity
  activityService.insertActivity(req);
  res.json(respUtil.removeSuccessResponse(req));
};

/**
 * Get election
 * @param req
 * @param res
 * @returns {details: Election}
 */
async function get(req, res) {
  logger.info('Log:Election Controller:get: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  res.json({
    details: req.election
  });
}// import { Election } from "mocha";


/**
 * Get election list. based on criteria
 * @param req
 * @param res
 * @param next
 * @returns {elections: elections, pagination: pagination}
 */
async function list(req, res, next) {
  let elections
  logger.info('Log:Election Controller:list: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  const query = await serviceUtil.generateListQuery(req,"election");  
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
  req.entityType = 'election';
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
  //   elections = await Election.aggregate(query)

  // } else {
  query.dbfields = { password: 0, salt: 0, _v: 0 };
  if (req.query.type === 'exportToCsv') {
    query.limit = (query.pagination.totalCount>200) ? 200 : query.pagination.totalCount
  }
  elections = await electionModel.list(query); // textLowerCasePlural
  // }
  if (req.query.type === 'exportToCsv') {
      elections = await exportToCsvViewService.applyCsvHashingToActions(req, elections);
  }
  query.pagination.totalCount = await electionModel.totalCount(query);
  res.json({
    elections: elections,
    pagination: query.pagination
  });
}

// Get election status
async function electionStatusByParty(req, res, next) {
 const pipeline = [
  {
    $lookup: {
      from: "constituencys",
      localField: "constituencyId",
      foreignField: "_id",
      as: "constituencys"
    }
  },
  {
    $unwind: {
      path: "$constituencys"
    }
  },
  {
    $group: {
      _id: "$status",
      count: {
        $sum: 1
      },
      electionIds: {
        $push: "$constituencys.name"
      }
    }
  },
  {
    $project: {
      status: "$_id",
      electionIds: "$electionIds",
      count: "$count",
      _id: 0
    }
  }
]

const result = await electionModel.aggregate(pipeline);
res.json({electionStatus : result})
}


/**
 * Load election and append to req.
 * @param req
 * @param res
 * @param next
 */
async function load(req, res, next) {
  try{
    req.election = await electionModel.get(req.params.electionId);
    return next();
  }catch(err){
    req.i18nKey="idNotFound"
    return res.json(respUtil.getErrorResponse(req))
  }
}

/**
 * Create new election
 * @param req
 * @param res
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function  create(req, res) {
  try{
  logger.info('Log:Election Controller:create: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let startDate = new Date(req.body.startDate)
  let endDate = new Date(req.body.endDate)
  req.body.startDate = startDate
  req.body.endDate= endDate
  let election = new electionModel(req.body); // election // ElectionFirst
  let preCreateResult = await preCreate(election)
  
  election = await electionService.setCreateElectionVariables(req, election);
  let preSaveCreateResult = await preSaveCreate(election)
  req.election = await electionModel.saveData(election);
  let postSaveCreateResult = await postSaveCreate(req.election)
  req.entityType = 'election';
  req.activityKey = 'electionCreate';
  
  // adding election create activity
  activityService.insertActivity(req);
  res.json(respUtil.createSuccessResponse(req));
  }catch(err){console.log(err)}
}

/**
 * Update existing election
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function update(req, res, next) {
  logger.info('Log:Election Controller:update: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let election = req.election;
  let preUpdateResult = await preUpdate(election)
  
  req.description = await serviceUtil.compareObjects(election, req.body);
  election = Object.assign(election, req.body);
  // election = _.merge(election, req.body);
  // election.set(req.body);
  election = await electionService.setUpdateElectionVariables(req, election);
  
  let preSaveUpdateResult = await preSaveUpdate(election)
  req.election = await electionModel.saveData(election);
  let postSaveUpdateResult = await postSaveUpdate(req.election)
  req.entityType = 'election';
  req.activityKey = 'electionUpdate';

  // adding election update activity
  activityService.insertActivity(req);
  res.json(respUtil.updateSuccessResponse(req));
}

/**
 * Delete election.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function remove(req, res, next) {
  logger.info('Log:Election Controller:remove: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let election = req.election;
  let preRemoveResult = await preRemove(election)
  election.active = false;
  election = await electionService.setUpdateElectionVariables(req, election);
  let preSaveRemoveResult = await preSaveRemove(election)
  req.election = await electionModel.saveData(election);
  let postSaveRemoveResult = await postSaveRemove(req.election)
  req.entityType = 'election';
  req.activityKey = 'electionDelete';

  // adding election delete activity
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
    logger.info('Log:Election Controller:multiupdate: query,body :' + JSON.stringify(req.body));
    await serviceUtil.checkPermission(req, res, "Edit", controller);
    if(req.body && req.body.selectedIds && req.body.selectedIds.length > 0  && req.body.updatedDetails){
      await electionModel.updateMany({ 
        _id:{ $in : req.body.selectedIds }
        },
        { $set: req.body.updatedDetails }
      )
    }
    req.entityType = 'election';
    req.activityKey = 'electionUpdate';
    activityService.insertActivity(req);
    res.json(respUtil.updateSuccessResponse(req));
  }

 const preCreate=async(election)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveCreate=async(election)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveCreate=async(election)=>{
    /**@Add Your custom Logic */
}
const preUpdate=async(election)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveUpdate=async(election)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveUpdate=async(election)=>{
    /**@Add Your custom Logic */
}
const preRemove=async(election)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveRemove=async(election)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveRemove=async(election)=>{
    /**@Add Your custom Logic */
}


export default {multidelete,get,list,load,create,update,remove,multiupdate,electionStatusByParty}