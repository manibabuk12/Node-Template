/**Models*/
import orderModel from '../models/order.model.js';
import projectsModel from '../models/project.model.js';
import listPreferencesModel from '../models/listPreferences.model.js';
import roleModel from '../models/roles.model.js';
/**Services*/
import orderService from '../services/order.service.js';
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


const controller = "Order";

/**
 *  multiDelete order.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function multidelete(req, res, next) {
  logger.info('Log:Order Controller:multidelete: query,body :' + JSON.stringify(req.query, req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  if (req.body && req.body.selectedIds && req.body.selectedIds.length > 0) {
    await orderModel.updateMany(
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
  req.entityType = 'order';
  req.activityKey = 'orderDelete';
  // adding order delete activity
  activityService.insertActivity(req);
  res.json(respUtil.removeSuccessResponse(req));
};

/**
 * Get order
 * @param req
 * @param res
 * @returns {details: Order}
 */
async function get(req, res) {
  logger.info('Log:Order Controller:get: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  res.json({
    details: req.order
  });
}// import { Order } from "mocha";


/**
 * Get order list. based on criteria
 * @param req
 * @param res
 * @param next
 * @returns {orders: orders, pagination: pagination}
 */
async function list(req, res, next) {
  let orders
  logger.info('Log:Order Controller:list: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  const query = await serviceUtil.generateListQuery(req,"order");  
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
  req.entityType = 'order';
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
  //   orders = await Order.aggregate(query)

  // } else {
  query.dbfields = { password: 0, salt: 0, _v: 0 };
  if (req.query.type === 'exportToCsv') {
    query.limit = (query.pagination.totalCount>200) ? 200 : query.pagination.totalCount
  }
  orders = await orderModel.list(query); // textLowerCasePlural
  // }
  if (req.query.type === 'exportToCsv') {
      orders = await exportToCsvViewService.applyCsvHashingToActions(req, orders);
  }
  query.pagination.totalCount = await orderModel.totalCount(query);
  res.json({
    orders: orders,
    pagination: query.pagination
  });
}


/**
 * Load order and append to req.
 * @param req
 * @param res
 * @param next
 */
async function load(req, res, next) {
  try{
    req.order = await orderModel.get(req.params.orderId);
    return next();
  }catch(err){
    req.i18nKey="idNotFound"
    return res.json(respUtil.getErrorResponse(req))
  }
}

/**
 * Create new order
 * @param req
 * @param res
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function create(req, res) {
  logger.info('Log:Order Controller:create: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let order = new orderModel(req.body); // order // OrderFirst
  let preCreateResult = await preCreate(order)
  
  
  order = await orderService.setCreateOrderVariables(req, order);
  let preSaveCreateResult = await preSaveCreate(order)
  req.order = await orderModel.saveData(order);
  let postSaveCreateResult = await postSaveCreate(req.order)
  req.entityType = 'order';
  req.activityKey = 'orderCreate';
  
  // adding order create activity
  activityService.insertActivity(req);
  res.json(respUtil.createSuccessResponse(req));
}

/**
 * Update existing order
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function update(req, res, next) {
  logger.info('Log:Order Controller:update: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let order = req.order;
  let preUpdateResult = await preUpdate(order)
  
  req.description = await serviceUtil.compareObjects(order, req.body);
  order = Object.assign(order, req.body);
  // order = _.merge(order, req.body);
  // order.set(req.body);
  order = await orderService.setUpdateOrderVariables(req, order);
  
  let preSaveUpdateResult = await preSaveUpdate(order)
  req.order = await orderModel.saveData(order);
  let postSaveUpdateResult = await postSaveUpdate(req.order)
  req.entityType = 'order';
  req.activityKey = 'orderUpdate';

  // adding order update activity
  activityService.insertActivity(req);
  res.json(respUtil.updateSuccessResponse(req));
}

/**
 * Delete order.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function remove(req, res, next) {
  logger.info('Log:Order Controller:remove: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let order = req.order;
  let preRemoveResult = await preRemove(order)
  order.active = false;
  order = await orderService.setUpdateOrderVariables(req, order);
  let preSaveRemoveResult = await preSaveRemove(order)
  req.order = await orderModel.saveData(order);
  let postSaveRemoveResult = await postSaveRemove(req.order)
  req.entityType = 'order';
  req.activityKey = 'orderDelete';

  // adding order delete activity
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
    logger.info('Log:Order Controller:multiupdate: query,body :' + JSON.stringify(req.body));
    await serviceUtil.checkPermission(req, res, "Edit", controller);
    if(req.body && req.body.selectedIds && req.body.selectedIds.length > 0  && req.body.updatedDetails){
      await orderModel.updateMany({ 
        _id:{ $in : req.body.selectedIds }
        },
        { $set: req.body.updatedDetails }
      )
    }
    req.entityType = 'order';
    req.activityKey = 'orderUpdate';
    activityService.insertActivity(req);
    res.json(respUtil.updateSuccessResponse(req));
  }

 const preCreate=async(order)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveCreate=async(order)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveCreate=async(order)=>{
    /**@Add Your custom Logic */
}
const preUpdate=async(order)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveUpdate=async(order)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveUpdate=async(order)=>{
    /**@Add Your custom Logic */
}
const preRemove=async(order)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveRemove=async(order)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveRemove=async(order)=>{
    /**@Add Your custom Logic */
}


export default {multidelete,get,list,load,create,update,remove,multiupdate}