/**Models*/
import userModel from '../models/user.model.js';
import roleModel from '../models/roles.model.js';
import listPreferencesModel from '../models/listPreferences.model.js';
/**Services*/
import userService from '../services/user.service.js';
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


const controller = "User";

/**
 * Create new user
 * @param req
 * @param res
 * @returns { respCode: respCode, respMessage: respMessage }
 */
 async function register(req, res) {
    logger.info('Log:User Controller:register: body :' + JSON.stringify(req.body), controller);
  
    await serviceUtil.checkPermission(req, res, "Edit", controller);
    if(req.body && req.body.email) req.body.email=req.body.email.toLowerCase()
    let user = new userModel(req.body);
  
    //check email exists or not
    const uniqueEmail = await userModel.findUniqueEmail(user.email);
    if (uniqueEmail) {
      req.i18nKey = 'emailExists';
      logger.error('Error:user Controller:register:' + i18nUtil.getI18nMessage('emailExists'), controller);
      return res.json(respUtil.getErrorResponse(req));
    }
    let requiredFieldError = await userService.requriedFields(req)
    if(requiredFieldError){
      req.i18nKey = 'requriedField';
      return res.json(respUtil.getErrorResponse(req));
    }
    
    /*replace_*validateFieldData*/
    user = await userService.setCreateUserVariables(req, user)

    /**@create ListPreference for individual login type */
    let newListPreference = await new listPreferencesModel({columnOrder:config.columnOrder,userId:user._id});
    /**@Saving the ListPreference */
    let savedPreference = await listPreferencesModel.saveData(newListPreference);
    /**@Assign that Preference to User */
    user.listPreferences = savedPreference._id;

    req.user = await userModel.saveData(user);
    req.user.password = req.user.salt = undefined;
    req.entityType = 'user';
    req.activityKey = 'userRegister';``
    activityService.insertActivity(req);
    if (req.body.email) {
    emailService.sendEmailviaGrid({
        templateName: config.emailTemplates.userWelcome,
        entityType: sessionUtil.getLoginType(req),
        emailParams: {
            to: req.body.email
            // link: templateInfo.clientUrl + '#/changeRecoverPassword/' + req.token + '?active=true'
        }
    });
}
    //send email to user
    // emailService.sendEmail(req, res);
    // let templateInfo = JSON.parse(JSON.stringify(config.mailSettings));
    // emailService.sendEmailviaGrid({
    //   templateName: config.emailTemplates.userWelcome,
    //   emailParams: {
    //     to: user.email,
    //     displayName: user.displayName,
    //     Id: req.user._id,
    //     link: templateInfo.adminUrl
    //   }
    // });
    logger.info('Log:user Controller:register:' + i18nUtil.getI18nMessage('userCreate'), controller);
    return res.json(respUtil.createSuccessResponse(req));
  }
  
/**
 *  auth-multiDelete user.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function multidelete(req, res, next) {
  logger.info('Log:User Controller:multidelete: query,body :' + JSON.stringify(req.query, req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  if (req.body && req.body.selectedIds && req.body.selectedIds.length > 0) {
    const validation = await checkOwnRecordIdExists(req);
    if (validation.isError) {
      return res.json(respUtil.getErrorResponse(req));
    }
    await userModel.updateMany(
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
  req.entityType = 'user';
  req.activityKey = 'userDelete';
  // adding user delete activity
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
 * Get user
 * @param req
 * @param res
 * @returns {details: User}
 */
async function get(req, res) {
  logger.info('Log:User Controller:get: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  res.json({
    details: req.user
  });
}// import { User } from "mocha";


/**
 * Get user list. based on criteria
 * @param req
 * @param res
 * @param next
 * @returns {users: users, pagination: pagination}
 */
async function list(req, res, next) {
  let users
  logger.info('Log:User Controller:list: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  const query = await serviceUtil.generateListQuery(req,"user");  
  // if (req.tokenInfo && req.tokenInfo._doc._id && req.tokenInfo._doc.role && req.tokenInfo._doc.role != 'Admin') {
  //   query.filter.createdBy = req.tokenInfo._id
  // }
  let roleDetails = {}
  if (req.tokenInfo && req.tokenInfo._doc && req.tokenInfo._doc.role) {
    roleDetails = await roleModel.findOne({ role: req.tokenInfo._doc.role, active:true })
  }
  if (!req.query.searchFrom) {
    if (req.tokenInfo && req.tokenInfo._doc && req.tokenInfo._doc._id && roleDetails && roleDetails.roleType && roleDetails.roleType === "User") {
      // query.filter.createdBy = req.tokenInfo._doc._id
      query.filter["$or"] = [{ createdBy: { $in: [req.tokenInfo._doc._id] } }, ];
    } else if (req.tokenInfo && req.tokenInfo._doc && req.tokenInfo._doc._id && roleDetails && roleDetails.roleType && roleDetails.roleType === "Manager") {
      let level = 0
      roleDetails.levels ? level = roleDetails.levels : level = 1;
      if (level >= 2) {
        level = level - 1;
        let reportingMembersArray = [req.tokenInfo._doc._id]
        level = level - 1;
        let reportingMembers = await userModel.find({ reportingTo: req.tokenInfo._doc._id }, { _id: 1 });
        for (let obj of reportingMembers) {
          reportingMembersArray.push(obj._id);
        }
        if (level > 0) {
          var flag = true
          while (flag) {
            if (reportingMembers && reportingMembers.length > 0) {
              let value1 = await userService.getUsers(reportingMembers)
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
        // query.filter.reportingTo = req.tokenInfo._doc._id //ofor User crud
        query.filter["$or"] = [{ reportingTo: { $in: [req.tokenInfo._doc._id] } }, ];
      }
    }
  }
  req.entityType = 'user';
  query.dbfields = { password: 0, salt: 0, _v: 0 };
  if (req.query.type === 'exportToCsv') {
    query.limit = (query.pagination.totalCount>200) ? 200 : query.pagination.totalCount
  }

  users = await userModel.list(query);
  if (req.query.type === 'exportToCsv') {
    users = await exportToCsvViewService.applyCsvHashingToActions(req, users);
  }
  query.pagination.totalCount = await userModel.totalCount(query);

  res.json({
    users: users,
    pagination: query.pagination
  });
}

// Get wishlist
async function getWishlist(req, res) {
  try {
    await serviceUtil.checkPermission(req, res, "View", "User");
    
    // Use the ID from the token session
    const user = await userModel.findById(req.tokenInfo._doc._id);
    
    if (!user) {
      req.i18nKey = "userNotFound";
      return res.json(respUtil.getErrorResponse(req));
    }
 
    return res.json({
      wishlist: user.wishList || []
    });
  } catch (err) {
    logger.error('Error:User Controller:getWishlist: ' + err);
    return res.json(respUtil.getErrorResponse(req));
  }
}
 
// Update product in wishlist 
async function updateWishlist(req, res) {
  try{
const userId = sessionUtil.getSessionLoginID(req)
const {wishList} = req.body
 
await userModel.updateOne({_id:userId},{$set: {wishList}})
res.json({message:"Wish List Updated Successfully"});

  }catch(error){
    res.status(500).json({error:error.message});
  }
}

/**
 * Load user and append to req.
 * @param req
 * @param res
 * @param next
 */
async function load(req, res, next) {
  try{
    req.user = await userModel.get(req.params.userId);
    return next();
  }catch(err){
    req.i18nKey="idNotFound"
    return res.json(respUtil.getErrorResponse(req))
  }
}

/**
 * Create new user
 * @param req
 * @param res
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function create(req, res) {
  logger.info('Log:User Controller:create: body :' + JSON.stringify(req.body), controller);

  await serviceUtil.checkPermission(req, res, "Edit", controller);
  if(req.body && req.body.email) req.body.email=req.body.email.toLowerCase()
  let user = new userModel(req.body);
  let preCreateResult = await preCreate(user)
  //check email exists or not
  const uniqueEmail = await userModel.findUniqueEmail(user.email);
  if (uniqueEmail) {
    req.i18nKey = 'emailExists';
    logger.error('Error:user Controller:create:' + i18nUtil.getI18nMessage('emailExists'), controller);
    return res.json(respUtil.getErrorResponse(req));
  }
  let requiredFieldError = await userService.requriedFields(req)
  if(requiredFieldError){
    req.i18nKey = 'requriedField';
    return res.json(respUtil.getErrorResponse(req));
  }
  
  
  user = await userService.setCreateUserVariables(req, user)
  let validateRes = await userService.validateFields(req, req.body);
              if(validateRes){
              return res.json(respUtil.getErrorResponse(req));
            }

  /**@create ListPreference for individual login type */
  let newListPreference = await new listPreferencesModel({columnOrder:config.columnOrder,userId:user._id});
  /**@Saving the ListPreference */
  let savedPreference = await listPreferencesModel.saveData(newListPreference);
  /**@Assign that Preference to User */
  user.listPreferences = savedPreference._id;

  let preSaveCreateResult = await preSaveCreate(user)
  req.user = await userModel.saveData(user);
  let postSaveCreateResult = await postSaveCreate(req.user)
  req.user.password = req.user.salt = undefined;
  req.entityType = 'user';
  req.activityKey = 'userCreate';
  activityService.insertActivity(req);
  if (req.body.email) {
    emailService.sendEmailviaGrid({
        templateName: config.emailTemplates.userCreate,
        entityType: sessionUtil.getLoginType(req),
        emailParams: {
            to: req.body.email
            // link: templateInfo.clientUrl + '#/changeRecoverPassword/' + req.token + '?active=true'
        }
    });
}
  //send email to user
  // emailService.sendEmail(req, res);
  // let templateInfo = JSON.parse(JSON.stringify(config.mailSettings));
  // emailService.sendEmailviaGrid({
  //   templateName: config.emailTemplates.userWelcome,
  //   emailParams: {
  //     to: user.email,
  //     displayName: user.displayName,
  //     Id: req.user._id,
  //     link: templateInfo.adminUrl
  //   }
  // });
  logger.info('Log:user Controller:create:' + i18nUtil.getI18nMessage('userCreate'), controller);
  return res.json(respUtil.createSuccessResponse(req));
}


/**
 * Update existing user
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function update(req, res, next) {
  logger.info('Log:User Controller:update: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let user = req.user;
  let preUpdateResult = await preUpdate(user)
  
  req.description = await serviceUtil.compareObjects(user, req.body);
  user = Object.assign(user, req.body);
  // user = _.merge(user, req.body);
  // user.set(req.body);
  user = await userService.setUpdateUserVariables(req, user);
  let validateRes = await userService.validateFields(req, req.body);
              if(validateRes){
              return res.json(respUtil.getErrorResponse(req));
            }
  let preSaveUpdateResult = await preSaveUpdate(user)
  req.user = await userModel.saveData(user);
  let postSaveUpdateResult = await postSaveUpdate(req.user)
  req.entityType = 'user';
  req.activityKey = 'userUpdate';

  // adding user update activity
  activityService.insertActivity(req);
  res.json(respUtil.updateSuccessResponse(req));
}

/**
 * Delete user.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function remove(req, res, next) {
  logger.info('Log:User Controller:remove: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let user = req.user;
  let preRemoveResult = await preRemove(user)
  user.active = false;
  user = await userService.setUpdateUserVariables(req, user);
  let preSaveRemoveResult = await preSaveRemove(user)
  req.user = await userModel.saveData(user);
  let postSaveRemoveResult = await postSaveRemove(req.user)
  req.entityType = 'user';
  req.activityKey = 'userDelete';

  // adding user delete activity
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
    logger.info('Log:User Controller:multiupdate: query,body :' + JSON.stringify(req.body));
    await serviceUtil.checkPermission(req, res, "Edit", controller);
    if(req.body && req.body.selectedIds && req.body.selectedIds.length > 0  && req.body.updatedDetails){
      await userModel.updateMany({ 
        _id:{ $in : req.body.selectedIds }
        },
        { $set: req.body.updatedDetails }
      )
    }
    req.entityType = 'user';
    req.activityKey = 'userUpdate';
    activityService.insertActivity(req);
    res.json(respUtil.updateSuccessResponse(req));
  }

 const roleBasedOrdersProductsReviews = async (req, res) => {
  try {

    const data = await userService.roleBasedOrdersProductsReviews(req);

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
 const preCreate=async(user)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveCreate=async(user)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveCreate=async(user)=>{
    /**@Add Your custom Logic */
}
const preUpdate=async(user)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveUpdate=async(user)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveUpdate=async(user)=>{
    /**@Add Your custom Logic */
}
const preRemove=async(user)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveRemove=async(user)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveRemove=async(user)=>{
    /**@Add Your custom Logic */
}


export default {register,multidelete,get,list,load,create,update,remove,multiupdate,updateWishlist,getWishlist,roleBasedOrdersProductsReviews}