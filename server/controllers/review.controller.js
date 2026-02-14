/**Models*/
import reviewModel from '../models/review.model.js';
import projectsModel from '../models/project.model.js';
import listPreferencesModel from '../models/listPreferences.model.js';
import roleModel from '../models/roles.model.js';
/**Services*/
import reviewService from '../services/review.service.js';
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


const controller = "Review";

/**
 *  multiDelete review.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function multidelete(req, res, next) {
  logger.info('Log:Review Controller:multidelete: query,body :' + JSON.stringify(req.query, req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  if (req.body && req.body.selectedIds && req.body.selectedIds.length > 0) {
    await reviewModel.updateMany(
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
  req.entityType = 'review';
  req.activityKey = 'reviewDelete';
  // adding review delete activity
  activityService.insertActivity(req);
  res.json(respUtil.removeSuccessResponse(req));
};

/**
 * Get review
 * @param req
 * @param res
 * @returns {details: Review}
 */
async function get(req, res) {
  logger.info('Log:Review Controller:get: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  res.json({
    details: req.review
  });
}// import { Review } from "mocha";


/**
 * Get review list. based on criteria
 * @param req
 * @param res
 * @param next
 * @returns {reviews: reviews, pagination: pagination}
 */
async function list(req, res, next) {
  let reviews
  logger.info('Log:Review Controller:list: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  const query = await serviceUtil.generateListQuery(req,"review");  
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
  req.entityType = 'review';
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
  //   reviews = await Review.aggregate(query)

  // } else {
  query.dbfields = { password: 0, salt: 0, _v: 0 };
  if (req.query.type === 'exportToCsv') {
    query.limit = (query.pagination.totalCount>200) ? 200 : query.pagination.totalCount
  }
  reviews = await reviewModel.list(query); // textLowerCasePlural
  // }
  if (req.query.type === 'exportToCsv') {
      reviews = await exportToCsvViewService.applyCsvHashingToActions(req, reviews);
  }
  query.pagination.totalCount = await reviewModel.totalCount(query);
  res.json({
    reviews: reviews,
    pagination: query.pagination
  });
}


/**
 * Load review and append to req.
 * @param req
 * @param res
 * @param next
 */
async function load(req, res, next) {
  try{
    req.review = await reviewModel.get(req.params.reviewId);
    return next();
  }catch(err){
    req.i18nKey="idNotFound"
    return res.json(respUtil.getErrorResponse(req))
  }
}

/**
 * Create new review
 * @param req
 * @param res
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function create(req, res) {
  logger.info('Log:Review Controller:create: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let review = new reviewModel(req.body); // review // ReviewFirst
  let preCreateResult = await preCreate(review)
  
  let error = await reviewService.reviewValidations(req, review);
  if(error){
    return res.json(respUtil.getErrorResponse(req));
  }
  
  review = await reviewService.setCreateReviewVariables(req, review);
  let preSaveCreateResult = await preSaveCreate(review)
  req.review = await reviewModel.saveData(review);
  let postSaveCreateResult = await postSaveCreate(req.review)
  req.entityType = 'review';
  req.activityKey = 'reviewCreate';


  
  // adding review create activity
  activityService.insertActivity(req);
  res.json(respUtil.createSuccessResponse(req));
}

/**
 * Update existing review
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function update(req, res, next) {
  logger.info('Log:Review Controller:update: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let review = req.review;
  let preUpdateResult = await preUpdate(review)
  
  req.description = await serviceUtil.compareObjects(review, req.body);
  review = Object.assign(review, req.body);
  // review = _.merge(review, req.body);
  // review.set(req.body);
  review = await reviewService.setUpdateReviewVariables(req, review);
  
  let preSaveUpdateResult = await preSaveUpdate(review)
  req.review = await reviewModel.saveData(review);
  let postSaveUpdateResult = await postSaveUpdate(req.review)
  req.entityType = 'review';
  req.activityKey = 'reviewUpdate';

  // adding review update activity
  activityService.insertActivity(req);
  res.json(respUtil.updateSuccessResponse(req));
}

/**
 * Delete review.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function remove(req, res, next) {
  logger.info('Log:Review Controller:remove: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let review = req.review;
  let preRemoveResult = await preRemove(review)
  review.active = false;
  review = await reviewService.setUpdateReviewVariables(req, review);
  let preSaveRemoveResult = await preSaveRemove(review)
  req.review = await reviewModel.saveData(review);
  let postSaveRemoveResult = await postSaveRemove(req.review)
  req.entityType = 'review';
  req.activityKey = 'reviewDelete';

  // adding review delete activity
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
    logger.info('Log:Review Controller:multiupdate: query,body :' + JSON.stringify(req.body));
    await serviceUtil.checkPermission(req, res, "Edit", controller);
    if(req.body && req.body.selectedIds && req.body.selectedIds.length > 0  && req.body.updatedDetails){
      await reviewModel.updateMany({ 
        _id:{ $in : req.body.selectedIds }
        },
        { $set: req.body.updatedDetails }
      )
    }
    req.entityType = 'review';
    req.activityKey = 'reviewUpdate';
    activityService.insertActivity(req);
    res.json(respUtil.updateSuccessResponse(req));
  }

 const preCreate=async(review)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveCreate=async(review)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveCreate=async(review)=>{
    /**@Add Your custom Logic */
}
const preUpdate=async(review)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveUpdate=async(review)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveUpdate=async(review)=>{
    /**@Add Your custom Logic */
}
const preRemove=async(review)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveRemove=async(review)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveRemove=async(review)=>{
    /**@Add Your custom Logic */
}


export default {multidelete,get,list,load,create,update,remove,multiupdate}