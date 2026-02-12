/**Models*/
import voteModel from '../models/vote.model.js';
import projectsModel from '../models/project.model.js';
import listPreferencesModel from '../models/listPreferences.model.js';
import roleModel from '../models/roles.model.js';
import partyModel from '../models/party.model.js';
/**Services*/
import voteService from '../services/vote.service.js';
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


const controller = "Vote";

/**
 *  multiDelete vote.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function multidelete(req, res, next) {
  logger.info('Log:Vote Controller:multidelete: query,body :' + JSON.stringify(req.query, req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  if (req.body && req.body.selectedIds && req.body.selectedIds.length > 0) {
    await voteModel.updateMany(
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
  req.entityType = 'vote';
  req.activityKey = 'voteDelete';
  // adding vote delete activity
  activityService.insertActivity(req);
  res.json(respUtil.removeSuccessResponse(req));
};

/**
 * Get vote
 * @param req
 * @param res
 * @returns {details: Vote}
 */
async function get(req, res) {
  logger.info('Log:Vote Controller:get: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  res.json({
    details: req.vote
  });
}// import { Vote } from "mocha";


/**
 * Get vote list. based on criteria
 * @param req
 * @param res
 * @param next
 * @returns {votes: votes, pagination: pagination}
 */
async function list(req, res, next) {
  let votes
  logger.info('Log:Vote Controller:list: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  const query = await serviceUtil.generateListQuery(req,"vote");  
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
  req.entityType = 'vote';
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
  //   votes = await Vote.aggregate(query)

  // } else {
  query.dbfields = { password: 0, salt: 0, _v: 0 };
  if (req.query.type === 'exportToCsv') {
    query.limit = (query.pagination.totalCount>200) ? 200 : query.pagination.totalCount
  }
  votes = await voteModel.list(query); // textLowerCasePlural
  // }
  if (req.query.type === 'exportToCsv') {
      votes = await exportToCsvViewService.applyCsvHashingToActions(req, votes);
  }
  query.pagination.totalCount = await voteModel.totalCount(query);
  res.json({
    votes: votes,
    pagination: query.pagination
  });
}


/**
 * Load vote and append to req.
 * @param req
 * @param res
 * @param next
 */
async function load(req, res, next) {
  try{
    req.vote = await voteModel.get(req.params.voteId);
    return next();
  }catch(err){
    req.i18nKey="idNotFound"
    return res.json(respUtil.getErrorResponse(req))
  }
}

/**
 * Create new vote
 * @param req
 * @param res
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function create(req, res) {
  logger.info('Log:Vote Controller:create: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let vote = new voteModel(req.body); // vote // VoteFirst
  let preCreateResult = await preCreate(vote)
  
  
  vote = await voteService.setCreateVoteVariables(req, vote);
  let preSaveCreateResult = await preSaveCreate(vote)
  req.vote = await voteModel.saveData(vote);
  let postSaveCreateResult = await postSaveCreate(req.vote)
  req.entityType = 'vote';
  req.activityKey = 'voteCreate';
  
  // adding vote create activity
  activityService.insertActivity(req);
  res.json(respUtil.createSuccessResponse(req));
}

/**
 * Update existing vote
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function update(req, res, next) {
  logger.info('Log:Vote Controller:update: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let vote = req.vote;
  let preUpdateResult = await preUpdate(vote)
  
  req.description = await serviceUtil.compareObjects(vote, req.body);
  vote = Object.assign(vote, req.body);
  // vote = _.merge(vote, req.body);
  // vote.set(req.body);
  vote = await voteService.setUpdateVoteVariables(req, vote);
  
  let preSaveUpdateResult = await preSaveUpdate(vote)
  req.vote = await voteModel.saveData(vote);
  let postSaveUpdateResult = await postSaveUpdate(req.vote)
  req.entityType = 'vote';
  req.activityKey = 'voteUpdate';

  // adding vote update activity
  activityService.insertActivity(req);
  res.json(respUtil.updateSuccessResponse(req));
}

/**
 * Delete vote.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function remove(req, res, next) {
  logger.info('Log:Vote Controller:remove: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let vote = req.vote;
  let preRemoveResult = await preRemove(vote)
  vote.active = false;
  vote = await voteService.setUpdateVoteVariables(req, vote);
  let preSaveRemoveResult = await preSaveRemove(vote)
  req.vote = await voteModel.saveData(vote);
  let postSaveRemoveResult = await postSaveRemove(req.vote)
  req.entityType = 'vote';
  req.activityKey = 'voteDelete';

  // adding vote delete activity
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
    logger.info('Log:Vote Controller:multiupdate: query,body :' + JSON.stringify(req.body));
    await serviceUtil.checkPermission(req, res, "Edit", controller);
    if(req.body && req.body.selectedIds && req.body.selectedIds.length > 0  && req.body.updatedDetails){
      await voteModel.updateMany({ 
        _id:{ $in : req.body.selectedIds }
        },
        { $set: req.body.updatedDetails }
      )
    }
    req.entityType = 'vote';
    req.activityKey = 'voteUpdate';
    activityService.insertActivity(req);
    res.json(respUtil.updateSuccessResponse(req));
  }




async function getElectionResult(req, res, next){
  let responseJson = await voteService.winnerParty(req, res, next)
  res.json({message : "Winning party details",responseJson})
}

async function getVotesByPartys(req, res, next){
  let responseJson = await voteService.VotesForPartys(req, res, next)
  res.json({message : "Voting details for parties ",responseJson})
}

async function getPercentageOfVotes(req, res, next){
  let responseJson = await voteService.totalVotesCount(req, res, next)
  res.json({message : "Percentage of votes Voted ",responseJson})
}




 const preCreate=async(vote)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveCreate=async(vote)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveCreate=async(vote)=>{
    /**@Add Your custom Logic */
}
const preUpdate=async(vote)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveUpdate=async(vote)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveUpdate=async(vote)=>{
    /**@Add Your custom Logic */
}
const preRemove=async(vote)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveRemove=async(vote)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveRemove=async(vote)=>{
    /**@Add Your custom Logic */
}


export default {multidelete,get,list,load,create,update,remove,multiupdate,getElectionResult, getVotesByPartys,getPercentageOfVotes}