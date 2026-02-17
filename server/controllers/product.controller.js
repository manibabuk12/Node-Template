/**Models*/
import productModel from '../models/product.model';
import projectsModel from '../models/project.model';
import listPreferencesModel from '../models/listPreferences.model.js';
import roleModel from '../models/roles.model';
/**Services*/
import productService from '../services/product.service';
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


const controller = "Product";

/**
 *  multiDelete product.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function multidelete(req, res, next) {
  logger.info('Log:Product Controller:multidelete: query,body :' + JSON.stringify(req.query, req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  if (req.body && req.body.selectedIds && req.body.selectedIds.length > 0) {
    await productModel.updateMany(
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
  req.entityType = 'product';
  req.activityKey = 'productDelete';
  // adding product delete activity
  activityService.insertActivity(req);
  res.json(respUtil.removeSuccessResponse(req));
};

/**
 * Get product
 * @param req
 * @param res
 * @returns {details: Product}
 */
async function get(req, res) {
  logger.info('Log:Product Controller:get: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  res.json({
    details: req.product
  });
}// import { Product } from "mocha";


/**
 * Get product list. based on criteria
 * @param req
 * @param res
 * @param next
 * @returns {products: products, pagination: pagination}
 */
async function list(req, res, next) {
  let products
  logger.info('Log:Product Controller:list: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  const query = await serviceUtil.generateListQuery(req,"product");  
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
  req.entityType = 'product';
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
  //   products = await Product.aggregate(query)

  // } else {
  query.dbfields = { password: 0, salt: 0, _v: 0 };
  if (req.query.type === 'exportToCsv') {
    query.limit = (query.pagination.totalCount>200) ? 200 : query.pagination.totalCount
  }

  if(!roleDetails || roleDetails.roleType === "user"){
    query.filter.dateOfExpiry = {$gte: new Date()};
  }
  products = await productModel.list(query); // textLowerCasePlural
  // }
  if (req.query.type === 'exportToCsv') {
      products = await exportToCsvViewService.applyCsvHashingToActions(req, products);
  }
  query.pagination.totalCount = await productModel.totalCount(query);
  res.json({
    products: products,
    pagination: query.pagination
  });
}


/**
 * Load product and append to req.
 * @param req
 * @param res
 * @param next
 */
async function load(req, res, next) {
  try{
    req.product = await productModel.get(req.params.productId);
    return next();
  }catch(err){
    req.i18nKey="idNotFound"
    return res.json(respUtil.getErrorResponse(req))
  }
}

/**
 * Create new product
 * @param req
 * @param res
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function create(req, res) {
  logger.info('Log:Product Controller:create: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let product = new productModel(req.body); // product // ProductFirst
  let preCreateResult = await preCreate(product)
  
  
  product = await productService.setCreateProductVariables(req, product);
  let preSaveCreateResult = await preSaveCreate(product)
  req.product = await productModel.saveData(product);
  let postSaveCreateResult = await postSaveCreate(req.product)
  req.entityType = 'product';
  req.activityKey = 'productCreate';
  
  // adding product create activity
  activityService.insertActivity(req);
  res.json(respUtil.createSuccessResponse(req));
}

/**
 * Update existing product
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function update(req, res, next) {
  logger.info('Log:Product Controller:update: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let product = req.product;
  let preUpdateResult = await preUpdate(product)
  
  req.description = await serviceUtil.compareObjects(product, req.body);
  product = Object.assign(product, req.body);
  // product = _.merge(product, req.body);
  // product.set(req.body);
  product = await productService.setUpdateProductVariables(req, product);
  
  let preSaveUpdateResult = await preSaveUpdate(product)
  req.product = await productModel.saveData(product);
  let postSaveUpdateResult = await postSaveUpdate(req.product)
  req.entityType = 'product';
  req.activityKey = 'productUpdate';

  // adding product update activity
  activityService.insertActivity(req);
  res.json(respUtil.updateSuccessResponse(req));
}

/**
 * Delete product.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function remove(req, res, next) {
  logger.info('Log:Product Controller:remove: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let product = req.product;
  let preRemoveResult = await preRemove(product)
  product.active = false;
  product = await productService.setUpdateProductVariables(req, product);
  let preSaveRemoveResult = await preSaveRemove(product)
  req.product = await productModel.saveData(product);
  let postSaveRemoveResult = await postSaveRemove(req.product)
  req.entityType = 'product';
  req.activityKey = 'productDelete';

  // adding product delete activity
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
    logger.info('Log:Product Controller:multiupdate: query,body :' + JSON.stringify(req.body));
    await serviceUtil.checkPermission(req, res, "Edit", controller);
    if(req.body && req.body.selectedIds && req.body.selectedIds.length > 0  && req.body.updatedDetails){
      await productModel.updateMany({ 
        _id:{ $in : req.body.selectedIds }
        },
        { $set: req.body.updatedDetails }
      )
    }
    req.entityType = 'product';
    req.activityKey = 'productUpdate';
    activityService.insertActivity(req);
    res.json(respUtil.updateSuccessResponse(req));
  }

 const preCreate=async(product)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveCreate=async(product)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveCreate=async(product)=>{
    /**@Add Your custom Logic */
}
const preUpdate=async(product)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveUpdate=async(product)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveUpdate=async(product)=>{
    /**@Add Your custom Logic */
}
const preRemove=async(product)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveRemove=async(product)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveRemove=async(product)=>{
    /**@Add Your custom Logic */
}


export default {multidelete,get,list,load,create,update,remove,multiupdate}