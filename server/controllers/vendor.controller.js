/**Models*/
import vendorModel from '../models/vendor.model.js';
import roleModel from '../models/roles.model.js';
import listPreferencesModel from '../models/listPreferences.model.js';
/**Services*/
import vendorService from '../services/vendor.service.js';
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


const controller = "Vendor";

/**
 * Create new vendor
 * @param req
 * @param res
 * @returns { respCode: respCode, respMessage: respMessage }
 */
 async function register(req, res) {
    logger.info('Log:Vendor Controller:register: body :' + JSON.stringify(req.body), controller);
  
    await serviceUtil.checkPermission(req, res, "Edit", controller);
    if(req.body && req.body.email) req.body.email=req.body.email.toLowerCase()
    let vendor = new vendorModel(req.body);
  
    //check email exists or not
    const uniqueEmail = await vendorModel.findUniqueEmail(vendor.email);
    if (uniqueEmail) {
      req.i18nKey = 'emailExists';
      logger.error('Error:vendor Controller:register:' + i18nUtil.getI18nMessage('emailExists'), controller);
      return res.json(respUtil.getErrorResponse(req));
    }
    let requiredFieldError = await vendorService.requriedFields(req)
    if(requiredFieldError){
      req.i18nKey = 'requriedField';
      return res.json(respUtil.getErrorResponse(req));
    }
    
    /*replace_*validateFieldData*/
    vendor = await vendorService.setCreateVendorVariables(req, vendor)

    /**@create ListPreference for individual login type */
    let newListPreference = await new listPreferencesModel({columnOrder:config.columnOrder,vendorId:vendor._id});
    /**@Saving the ListPreference */
    let savedPreference = await listPreferencesModel.saveData(newListPreference);
    /**@Assign that Preference to Vendor */
    vendor.listPreferences = savedPreference._id;

    req.vendor = await vendorModel.saveData(vendor);
    req.vendor.password = req.vendor.salt = undefined;
    req.entityType = 'vendor';
    req.activityKey = 'vendorRegister';``
    activityService.insertActivity(req);
    if (req.body.email) {
    emailService.sendEmailviaGrid({
        templateName: config.emailTemplates.vendorWelcome,
        entityType: sessionUtil.getLoginType(req),
        emailParams: {
            to: req.body.email
            // link: templateInfo.clientUrl + '#/changeRecoverPassword/' + req.token + '?active=true'
        }
    });
}
    //send email to vendor
    // emailService.sendEmail(req, res);
    // let templateInfo = JSON.parse(JSON.stringify(config.mailSettings));
    // emailService.sendEmailviaGrid({
    //   templateName: config.emailTemplates.vendorWelcome,
    //   emailParams: {
    //     to: vendor.email,
    //     displayName: vendor.displayName,
    //     Id: req.vendor._id,
    //     link: templateInfo.adminUrl
    //   }
    // });
    logger.info('Log:vendor Controller:register:' + i18nUtil.getI18nMessage('vendorCreate'), controller);
    return res.json(respUtil.createSuccessResponse(req));
  }
  
/**
 *  auth-multiDelete vendor.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function multidelete(req, res, next) {
  logger.info('Log:Vendor Controller:multidelete: query,body :' + JSON.stringify(req.query, req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  if (req.body && req.body.selectedIds && req.body.selectedIds.length > 0) {
    const validation = await checkOwnRecordIdExists(req);
    if (validation.isError) {
      return res.json(respUtil.getErrorResponse(req));
    }
    await vendorModel.updateMany(
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
  req.entityType = 'vendor';
  req.activityKey = 'vendorDelete';
  // adding vendor delete activity
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
 * Get vendor
 * @param req
 * @param res
 * @returns {details: Vendor}
 */
async function get(req, res) {
  logger.info('Log:Vendor Controller:get: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  res.json({
    details: req.vendor
  });
}// import { Vendor } from "mocha";


/**
 * Get vendor list. based on criteria
 * @param req
 * @param res
 * @param next
 * @returns {vendors: vendors, pagination: pagination}
 */
async function list(req, res, next) {
  let vendors
  logger.info('Log:Vendor Controller:list: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  const query = await serviceUtil.generateListQuery(req,"vendor");  
  // if (req.tokenInfo && req.tokenInfo._doc._id && req.tokenInfo._doc.role && req.tokenInfo._doc.role != 'Admin') {
  //   query.filter.createdBy = req.tokenInfo._id
  // }
  let roleDetails = {}
  if (req.tokenInfo && req.tokenInfo._doc && req.tokenInfo._doc.role) {
    roleDetails = await roleModel.findOne({ role: req.tokenInfo._doc.role, active:true })
  }
  if (!req.query.searchFrom) {
    if (req.tokenInfo && req.tokenInfo._doc && req.tokenInfo._doc._id && roleDetails && roleDetails.roleType && roleDetails.roleType === "Vendor") {
      // query.filter.createdBy = req.tokenInfo._doc._id
      query.filter["$or"] = [{ createdBy: { $in: [req.tokenInfo._doc._id] } }, ];
    } else if (req.tokenInfo && req.tokenInfo._doc && req.tokenInfo._doc._id && roleDetails && roleDetails.roleType && roleDetails.roleType === "Manager") {
      let level = 0
      roleDetails.levels ? level = roleDetails.levels : level = 1;
      if (level >= 2) {
        level = level - 1;
        let reportingMembersArray = [req.tokenInfo._doc._id]
        level = level - 1;
        let reportingMembers = await vendorModel.find({ reportingTo: req.tokenInfo._doc._id }, { _id: 1 });
        for (let obj of reportingMembers) {
          reportingMembersArray.push(obj._id);
        }
        if (level > 0) {
          var flag = true
          while (flag) {
            if (reportingMembers && reportingMembers.length > 0) {
              let value1 = await vendorService.getVendors(reportingMembers)
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
        // query.filter.reportingTo = req.tokenInfo._doc._id //ofor Vendor crud
        query.filter["$or"] = [{ reportingTo: { $in: [req.tokenInfo._doc._id] } }, ];
      }
    }
  }
  req.entityType = 'vendor';
  query.dbfields = { password: 0, salt: 0, _v: 0 };
  if (req.query.type === 'exportToCsv') {
    query.limit = (query.pagination.totalCount>200) ? 200 : query.pagination.totalCount
  }

  vendors = await vendorModel.list(query);
  if (req.query.type === 'exportToCsv') {
    vendors = await exportToCsvViewService.applyCsvHashingToActions(req, vendors);
  }
  query.pagination.totalCount = await vendorModel.totalCount(query);

  res.json({
    vendors: vendors,
    pagination: query.pagination
  });
}

// Get wishlist
async function getWishlist(req, res) {
  try {
    await serviceUtil.checkPermission(req, res, "View", "Vendor");
    
    // Use the ID from the token session
    const vendor = await vendorModel.findById(req.tokenInfo._doc._id);
    
    if (!vendor) {
      req.i18nKey = "vendorNotFound";
      return res.json(respUtil.getErrorResponse(req));
    }
 
    return res.json({
      wishlist: vendor.wishList || []
    });
  } catch (err) {
    logger.error('Error:Vendor Controller:getWishlist: ' + err);
    return res.json(respUtil.getErrorResponse(req));
  }
}
 
// Update product in wishlist 
async function updateWishlist(req, res) {
const vendorId = sessionUtil.getSessionLoginID(req)
const {wishList} = req.body
 
await vendorModel.updateOne({_id:vendorId},{$set: {wishList}})
res.json(respUtil.successResponse("Wish List Updated Successfully"));
}

/**
 * Load vendor and append to req.
 * @param req
 * @param res
 * @param next
 */
async function load(req, res, next) {
  try{
    req.vendor = await vendorModel.get(req.params.vendorId);
    return next();
  }catch(err){
    req.i18nKey="idNotFound"
    return res.json(respUtil.getErrorResponse(req))
  }
}

/**
 * Create new vendor
 * @param req
 * @param res
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function create(req, res) {
  logger.info('Log:Vendor Controller:create: body :' + JSON.stringify(req.body), controller);

  await serviceUtil.checkPermission(req, res, "Edit", controller);
  if(req.body && req.body.email) req.body.email=req.body.email.toLowerCase()
  let vendor = new vendorModel(req.body);
  let preCreateResult = await preCreate(vendor)
  //check email exists or not
  const uniqueEmail = await vendorModel.findUniqueEmail(vendor.email);
  if (uniqueEmail) {
    req.i18nKey = 'emailExists';
    logger.error('Error:vendor Controller:create:' + i18nUtil.getI18nMessage('emailExists'), controller);
    return res.json(respUtil.getErrorResponse(req));
  }
  let requiredFieldError = await vendorService.requriedFields(req)
  if(requiredFieldError){
    req.i18nKey = 'requriedField';
    return res.json(respUtil.getErrorResponse(req));
  }
  
  
  vendor = await vendorService.setCreateVendorVariables(req, vendor)
  let validateRes = await vendorService.validateFields(req, req.body);
              if(validateRes){
              return res.json(respUtil.getErrorResponse(req));
            }

  /**@create ListPreference for individual login type */
  let newListPreference = await new listPreferencesModel({columnOrder:config.columnOrder,vendorId:vendor._id});
  /**@Saving the ListPreference */
  let savedPreference = await listPreferencesModel.saveData(newListPreference);
  /**@Assign that Preference to Vendor */
  vendor.listPreferences = savedPreference._id;

  let preSaveCreateResult = await preSaveCreate(vendor)
  req.vendor = await vendorModel.saveData(vendor);
  let postSaveCreateResult = await postSaveCreate(req.vendor)
  req.vendor.password = req.vendor.salt = undefined;
  req.entityType = 'vendor';
  req.activityKey = 'vendorCreate';
  activityService.insertActivity(req);
  if (req.body.email) {
    emailService.sendEmailviaGrid({
        templateName: config.emailTemplates.vendorCreate,
        entityType: sessionUtil.getLoginType(req),
        emailParams: {
            to: req.body.email
            // link: templateInfo.clientUrl + '#/changeRecoverPassword/' + req.token + '?active=true'
        }
    });
}
  //send email to vendor
  // emailService.sendEmail(req, res);
  // let templateInfo = JSON.parse(JSON.stringify(config.mailSettings));
  // emailService.sendEmailviaGrid({
  //   templateName: config.emailTemplates.vendorWelcome,
  //   emailParams: {
  //     to: vendor.email,
  //     displayName: vendor.displayName,
  //     Id: req.vendor._id,
  //     link: templateInfo.adminUrl
  //   }
  // });
  logger.info('Log:vendor Controller:create:' + i18nUtil.getI18nMessage('vendorCreate'), controller);
  return res.json(respUtil.createSuccessResponse(req));
}


/**
 * Update existing vendor
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function update(req, res, next) {
  logger.info('Log:Vendor Controller:update: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let vendor = req.vendor;
  let preUpdateResult = await preUpdate(vendor)
  
  req.description = await serviceUtil.compareObjects(vendor, req.body);
  vendor = Object.assign(vendor, req.body);
  // vendor = _.merge(vendor, req.body);
  // vendor.set(req.body);
  vendor = await vendorService.setUpdateVendorVariables(req, vendor);
  let validateRes = await vendorService.validateFields(req, req.body);
              if(validateRes){
              return res.json(respUtil.getErrorResponse(req));
            }
  let preSaveUpdateResult = await preSaveUpdate(vendor)
  req.vendor = await vendorModel.saveData(vendor);
  let postSaveUpdateResult = await postSaveUpdate(req.vendor)
  req.entityType = 'vendor';
  req.activityKey = 'vendorUpdate';

  // adding vendor update activity
  activityService.insertActivity(req);
  res.json(respUtil.updateSuccessResponse(req));
}

/**
 * Delete vendor.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function remove(req, res, next) {
  logger.info('Log:Vendor Controller:remove: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let vendor = req.vendor;
  let preRemoveResult = await preRemove(vendor)
  vendor.active = false;
  vendor = await vendorService.setUpdateVendorVariables(req, vendor);
  let preSaveRemoveResult = await preSaveRemove(vendor)
  req.vendor = await vendorModel.saveData(vendor);
  let postSaveRemoveResult = await postSaveRemove(req.vendor)
  req.entityType = 'vendor';
  req.activityKey = 'vendorDelete';

  // adding vendor delete activity
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
    logger.info('Log:Vendor Controller:multiupdate: query,body :' + JSON.stringify(req.body));
    await serviceUtil.checkPermission(req, res, "Edit", controller);
    if(req.body && req.body.selectedIds && req.body.selectedIds.length > 0  && req.body.updatedDetails){
      await vendorModel.updateMany({ 
        _id:{ $in : req.body.selectedIds }
        },
        { $set: req.body.updatedDetails }
      )
    }
    req.entityType = 'vendor';
    req.activityKey = 'vendorUpdate';
    activityService.insertActivity(req);
    res.json(respUtil.updateSuccessResponse(req));
  }

 const roleBasedOrdersProductsReviews = async (req, res) => {
  try {

    const data = await vendorService.roleBasedOrdersProductsReviews(req);

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {

    console.error("Error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};


const getVendorDashboard = async (req, res) => {
  try {

    const vendorId = req.tokenInfo.vendorId;

    const dashboardData = await vendorService.getVendorDashboardService(vendorId);

    return res.status(200).json({
      success: true,
      message: "Vendor dashboard fetched successfully",
      data: dashboardData
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

 const preCreate=async(vendor)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveCreate=async(vendor)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveCreate=async(vendor)=>{
    /**@Add Your custom Logic */
}
const preUpdate=async(vendor)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveUpdate=async(vendor)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveUpdate=async(vendor)=>{
    /**@Add Your custom Logic */
}
const preRemove=async(vendor)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveRemove=async(vendor)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveRemove=async(vendor)=>{
    /**@Add Your custom Logic */
}


export default {register,multidelete,get,list,load,create,update,remove,multiupdate,
  updateWishlist,getWishlist,roleBasedOrdersProductsReviews,getVendorDashboard}