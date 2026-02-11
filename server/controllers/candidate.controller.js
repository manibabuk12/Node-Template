/**Models*/
import candidateModel from '../models/candidate.model.js';
import projectsModel from '../models/project.model.js';
import listPreferencesModel from '../models/listPreferences.model.js';
import roleModel from '../models/roles.model.js';
/**Services*/
import candidateService from '../services/candidate.service.js';
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


const controller = "Candidate";

/**
 *  multiDelete candidate.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function multidelete(req, res, next) {
  logger.info('Log:Candidate Controller:multidelete: query,body :' + JSON.stringify(req.query, req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  if (req.body && req.body.selectedIds && req.body.selectedIds.length > 0) {
    await candidateModel.updateMany(
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
  req.entityType = 'candidate';
  req.activityKey = 'candidateDelete';
  // adding candidate delete activity
  activityService.insertActivity(req);
  res.json(respUtil.removeSuccessResponse(req));
};

/**
 * Get candidate
 * @param req
 * @param res
 * @returns {details: Candidate}
 */
async function get(req, res) {
  logger.info('Log:Candidate Controller:get: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  res.json({
    details: req.candidate
  });
}// import { Candidate } from "mocha";

async function listCandidatesByParty(req, res, next) {
 let candidates
logger.info('Log:Candidate Controller:list: query :' + JSON.stringify(req.query));
await serviceUtil.checkPermission(req, res, "View", controller);
const query = await serviceUtil.generateListQuery(req,"candidate");
let roleDetails = {}
if (req.tokenInfo && req.tokenInfo._doc && req.tokenInfo._doc.role) {
roleDetails = await roleModel.findOne({ role: req.tokenInfo._doc.role,active:true });
 }
req.entityType = 'candidate';
query.dbfields = { password: 0, salt: 0, _v: 0 };
if (req.query.type === 'exportToCsv') {
query.limit = (query.pagination.totalCount>200) ? 200 : query.pagination.totalCount
 }
candidates = await candidateModel.aggregate(
[
  {
    $match: {
      active: true
    }
  },
  {
    $lookup: {
      from: "partys",
      localField: "partyId",
      foreignField: "_id",
      as: "party"
    }
  },
  {
    $unwind: {
      path: "$party"
    }
  },
  {
    $group: {
      _id: "$party.name",
      Candidates: {
        $push: "$$ROOT"
      }
    }
  },
  {
    $project:

      {
        partyName: "$_id",
        candidates: "$Candidates.name"
      }
  }
]
 ); 
query.pagination.totalCount = await candidateModel.totalCount(query);
res.json({
candidates: candidates,
totalNoOfCandidates: query.pagination
 });
}

async function listCandidatesByConstituency(req, res, next) {
 let candidates
logger.info('Log:Candidate Controller:list: query :' + JSON.stringify(req.query));
await serviceUtil.checkPermission(req, res, "View", controller);
const query = await serviceUtil.generateListQuery(req,"candidate");
let roleDetails = {}
if (req.tokenInfo && req.tokenInfo._doc && req.tokenInfo._doc.role) {
roleDetails = await roleModel.findOne({ role: req.tokenInfo._doc.role,active:true });
 }
req.entityType = 'candidate';
query.dbfields = { password: 0, salt: 0, _v: 0 };
if (req.query.type === 'exportToCsv') {
query.limit = (query.pagination.totalCount>200) ? 200 : query.pagination.totalCount
 }
candidates = await candidateModel.aggregate(
[
  {
    $match: {
      active: true
    }
  },
  {
    $lookup: {
      from: "constituencys",
      localField: "constituencyId",
      foreignField: "_id",
      as: "Constituency"
    }
  },
  {
    $unwind: {
      path: "$Constituency"
    }
  },
  {
    $group: {
      _id: "$Constituency.name",
      Candidates: {
        $push: "$$ROOT"
      }
    }
  },
  {
    $project: {
      Constituency: "$_id",
      Candidates: "$Candidates.name"
    }
  }
]
 ); 
query.pagination.totalCount = await candidateModel.totalCount(query);
res.json({
candidates: candidates,
totalNoOfCandidates: query.pagination
 });
}

/**
 * Get candidate list. based on criteria
 * @param req
 * @param res
 * @param next
 * @returns {candidates: candidates, pagination: pagination}
 */
async function list(req, res, next) {
  let candidates
  logger.info('Log:Candidate Controller:list: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  const query = await serviceUtil.generateListQuery(req,"candidate");  
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
  req.entityType = 'candidate';
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
  //   candidates = await Candidate.aggregate(query)

  // } else {
  query.dbfields = { password: 0, salt: 0, _v: 0 };
  if (req.query.type === 'exportToCsv') {
    query.limit = (query.pagination.totalCount>200) ? 200 : query.pagination.totalCount
  }
  candidates = await candidateModel.list(query); // textLowerCasePlural
  // }
  if (req.query.type === 'exportToCsv') {
      candidates = await exportToCsvViewService.applyCsvHashingToActions(req, candidates);
  }
  query.pagination.totalCount = await candidateModel.totalCount(query);
  res.json({
    candidates: candidates,
    pagination: query.pagination
  });
}


/**
 * Load candidate and append to req.
 * @param req
 * @param res
 * @param next
 */
async function load(req, res, next) {
  try{
    req.candidate = await candidateModel.get(req.params.candidateId);
    return next();
  }catch(err){
    req.i18nKey="idNotFound"
    return res.json(respUtil.getErrorResponse(req))
  }
}

/**
 * Create new candidate
 * @param req
 * @param res
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function create(req, res) {
  logger.info('Log:Candidate Controller:create: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let candidate = new candidateModel(req.body); // candidate // CandidateFirst
  let preCreateResult = await preCreate(candidate)
  
  
  candidate = await candidateService.setCreateCandidateVariables(req, candidate);
  let preSaveCreateResult = await preSaveCreate(candidate)
  req.candidate = await candidateModel.saveData(candidate);
  let postSaveCreateResult = await postSaveCreate(req.candidate)
  req.entityType = 'candidate';
  req.activityKey = 'candidateCreate';
  
  // adding candidate create activity
  activityService.insertActivity(req);
  res.json(respUtil.createSuccessResponse(req));
}

/**
 * Update existing candidate
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function update(req, res, next) {
  logger.info('Log:Candidate Controller:update: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let candidate = req.candidate;
  let preUpdateResult = await preUpdate(candidate)
  
  req.description = await serviceUtil.compareObjects(candidate, req.body);
  candidate = Object.assign(candidate, req.body);
  // candidate = _.merge(candidate, req.body);
  // candidate.set(req.body);
  candidate = await candidateService.setUpdateCandidateVariables(req, candidate);
  
  let preSaveUpdateResult = await preSaveUpdate(candidate)
  req.candidate = await candidateModel.saveData(candidate);
  let postSaveUpdateResult = await postSaveUpdate(req.candidate)
  req.entityType = 'candidate';
  req.activityKey = 'candidateUpdate';

  // adding candidate update activity
  activityService.insertActivity(req);
  res.json(respUtil.updateSuccessResponse(req));
}

/**
 * Delete candidate.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function remove(req, res, next) {
  logger.info('Log:Candidate Controller:remove: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let candidate = req.candidate;
  let preRemoveResult = await preRemove(candidate)
  candidate.active = false;
  candidate = await candidateService.setUpdateCandidateVariables(req, candidate);
  let preSaveRemoveResult = await preSaveRemove(candidate)
  req.candidate = await candidateModel.saveData(candidate);
  let postSaveRemoveResult = await postSaveRemove(req.candidate)
  req.entityType = 'candidate';
  req.activityKey = 'candidateDelete';

  // adding candidate delete activity
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
    logger.info('Log:Candidate Controller:multiupdate: query,body :' + JSON.stringify(req.body));
    await serviceUtil.checkPermission(req, res, "Edit", controller);
    if(req.body && req.body.selectedIds && req.body.selectedIds.length > 0  && req.body.updatedDetails){
      await candidateModel.updateMany({ 
        _id:{ $in : req.body.selectedIds }
        },
        { $set: req.body.updatedDetails }
      )
    }
    req.entityType = 'candidate';
    req.activityKey = 'candidateUpdate';
    activityService.insertActivity(req);
    res.json(respUtil.updateSuccessResponse(req));
  }

 const preCreate=async(candidate)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveCreate=async(candidate)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveCreate=async(candidate)=>{
    /**@Add Your custom Logic */
}
const preUpdate=async(candidate)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveUpdate=async(candidate)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveUpdate=async(candidate)=>{
    /**@Add Your custom Logic */
}
const preRemove=async(candidate)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveRemove=async(candidate)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveRemove=async(candidate)=>{
    /**@Add Your custom Logic */
}


export default {multidelete,get,list,load,create,update,remove,multiupdate, listCandidatesByParty,listCandidatesByConstituency}