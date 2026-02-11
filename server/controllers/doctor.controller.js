/**Models*/
import doctorModel from '../models/doctor.model.js';
import roleModel from '../models/roles.model.js';
import listPreferencesModel from '../models/listPreferences.model.js';
/**Services*/
import doctorService from '../services/doctor.service.js';
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


const controller = "Doctor";

/**
 * Create new doctor
 * @param req
 * @param res
 * @returns { respCode: respCode, respMessage: respMessage }
 */
 async function register(req, res) {
    logger.info('Log:Doctor Controller:register: body :' + JSON.stringify(req.body), controller);
  
    await serviceUtil.checkPermission(req, res, "Edit", controller);
    if(req.body && req.body.email) req.body.email=req.body.email.toLowerCase()
    let doctor = new doctorModel(req.body);
  
    //check email exists or not
    const uniqueEmail = await doctorModel.findUniqueEmail(doctor.email);
    if (uniqueEmail) {
      req.i18nKey = 'emailExists';
      logger.error('Error:doctor Controller:register:' + i18nUtil.getI18nMessage('emailExists'), controller);
      return res.json(respUtil.getErrorResponse(req));
    }
    let requiredFieldError = await doctorService.requriedFields(req)
    if(requiredFieldError){
      req.i18nKey = 'requriedField';
      return res.json(respUtil.getErrorResponse(req));
    }
    
    /*replace_*validateFieldData*/
    doctor = await doctorService.setCreateDoctorVariables(req, doctor)

    /**@create ListPreference for individual login type */
    let newListPreference = await new listPreferencesModel({columnOrder:config.columnOrder,doctorId:doctor._id});
    /**@Saving the ListPreference */
    let savedPreference = await listPreferencesModel.saveData(newListPreference);
    /**@Assign that Preference to User */
    doctor.listPreferences = savedPreference._id;

    req.doctor = await doctorModel.saveData(doctor);
    req.doctor.password = req.doctor.salt = undefined;
    req.entityType = 'doctor';
    req.activityKey = 'doctorRegister';
    activityService.insertActivity(req);
    if (req.body.email) {
    emailService.sendEmailviaGrid({
        templateName: config.emailTemplates.doctorCreate,
        entityType: sessionUtil.getLoginType(req),
        emailParams: {
            to: req.body.email
            // link: templateInfo.clientUrl + '#/changeRecoverPassword/' + req.token + '?active=true'
        }
    });
}
    //send email to doctor
    // emailService.sendEmail(req, res);
    // let templateInfo = JSON.parse(JSON.stringify(config.mailSettings));
    // emailService.sendEmailviaGrid({
    //   templateName: config.emailTemplates.doctorWelcome,
    //   emailParams: {
    //     to: doctor.email,
    //     displayName: doctor.displayName,
    //     Id: req.doctor._id,
    //     link: templateInfo.adminUrl
    //   }
    // });
    logger.info('Log:doctor Controller:register:' + i18nUtil.getI18nMessage('doctorCreate'), controller);
    return res.json(respUtil.createSuccessResponse(req));
  }
  
/**
 *  auth-multiDelete doctor.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function multidelete(req, res, next) {
  logger.info('Log:Doctor Controller:multidelete: query,body :' + JSON.stringify(req.query, req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  if (req.body && req.body.selectedIds && req.body.selectedIds.length > 0) {
    const validation = await checkOwnRecordIdExists(req);
    if (validation.isError) {
      return res.json(respUtil.getErrorResponse(req));
    }
    await doctorModel.updateMany(
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
  req.entityType = 'doctor';
  req.activityKey = 'doctorDelete';
  // adding doctor delete activity
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
 * Get doctor
 * @param req
 * @param res
 * @returns {details: Doctor}
 */
async function get(req, res) {
  logger.info('Log:Doctor Controller:get: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  res.json({
    details: req.doctor
  });
}// import { Doctor } from "mocha";


/**
 * Get doctor list. based on criteria
 * @param req
 * @param res
 * @param next
 * @returns {doctors: doctors, pagination: pagination}
 */
async function list(req, res, next) {
  let doctors
  logger.info('Log:Doctor Controller:list: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  const query = await serviceUtil.generateListQuery(req,"doctor");  
  // if (req.tokenInfo && req.tokenInfo._doc._id && req.tokenInfo._doc.role && req.tokenInfo._doc.role != 'Admin') {
  //   query.filter.createdBy = req.tokenInfo._id
  // }
  let roleDetails = {}
  if (req.tokenInfo && req.tokenInfo._doc && req.tokenInfo._doc.role) {
    roleDetails = await roleModel.findOne({ role: req.tokenInfo._doc.role, active:true })
  }
  if (!req.query.searchFrom) {
    if (req.tokenInfo && req.tokenInfo._doc && req.tokenInfo._doc._id && roleDetails && roleDetails.roleType && roleDetails.roleType === "Doctor") {
      // query.filter.createdBy = req.tokenInfo._doc._id
      // query.filter["$or"] = [{ createdBy: { $in: [req.tokenInfo._doc._id] } }, ];


    } else if (req.tokenInfo && req.tokenInfo._doc && req.tokenInfo._doc._id && roleDetails && roleDetails.roleType && roleDetails.roleType === "Manager") {
      let level = 0
      roleDetails.levels ? level = roleDetails.levels : level = 1;
      if (level >= 2) {
        level = level - 1;
        let reportingMembersArray = [req.tokenInfo._doc._id]
        level = level - 1;
        let reportingMembers = await doctorModel.find({ reportingTo: req.tokenInfo._doc._id }, { _id: 1 });
        for (let obj of reportingMembers) {
          reportingMembersArray.push(obj._id);
        }
        if (level > 0) {
          var flag = true
          while (flag) {
            if (reportingMembers && reportingMembers.length > 0) {
              let value1 = await doctorService.getDoctors(reportingMembers)
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
        // query.filter.reportingTo = req.tokenInfo._doc._id //ofor Doctor crud
        query.filter["$or"] = [{ reportingTo: { $in: [req.tokenInfo._doc._id] } }, ];
      }
    }
  }
  req.entityType = 'doctor';
  query.dbfields = { password: 0, salt: 0, _v: 0 };
  if (req.query.type === 'exportToCsv') {
    query.limit = (query.pagination.totalCount>200) ? 200 : query.pagination.totalCount
  }
  if(req.tokenInfo && req.tokenInfo._doc.role == "doctor"){
    query.filter = {...query.filter,hospitalId:req.tokenInfo._doc.hospitalId}
  }
  
  doctors = await doctorModel.list(query);
  if (req.query.type === 'exportToCsv') {
    doctors = await exportToCsvViewService.applyCsvHashingToActions(req, doctors);
  }
  query.pagination.totalCount = await doctorModel.totalCount(query);

  res.json({
    doctors: doctors,
    pagination: query.pagination
  });
}


/**
 * Load doctor and append to req.
 * @param req
 * @param res
 * @param next
 */
async function load(req, res, next) {
  try{
    req.doctor = await doctorModel.get(req.params.doctorId);
    return next();
  }catch(err){
    req.i18nKey="idNotFound"
    return res.json(respUtil.getErrorResponse(req))
  }
}


async function getDoctorsBypatients(req, res, next) {
let doctors
logger.info('Log:Doctor Controller:list: query :' + JSON.stringify(req.query));
await serviceUtil.checkPermission(req, res, "View", controller);
const query = await serviceUtil.generateListQuery(req,"doctor");
// if (req.tokenInfo && req.tokenInfo._doc._id && req.tokenInfo._doc.role && req.tokenInfo._doc.role != 'Admin') {
// query.filter.createdBy = req.tokenInfo._id
// }
let roleDetails = {}
if (req.tokenInfo && req.tokenInfo._doc && req.tokenInfo._doc.role) {
roleDetails = await roleModel.findOne({ role: req.tokenInfo._doc.role, active:true })
}
if (!req.query.searchFrom) {
if (req.tokenInfo && req.tokenInfo._doc && req.tokenInfo._doc._id && roleDetails && roleDetails.roleType && roleDetails.roleType === "Doctor") {
// query.filter.createdBy = req.tokenInfo._doc._id
// query.filter["$or"] = [{ createdBy: { $in: [req.tokenInfo._doc._id] } }, ];

query.filter._id = req.tokenInfo._doc._id;

} else if (req.tokenInfo && req.tokenInfo._doc && req.tokenInfo._doc._id && roleDetails && roleDetails.roleType && roleDetails.roleType === "Manager") {
let level = 0
roleDetails.levels ? level = roleDetails.levels : level = 1;
if (level >= 2) {
level = level - 1;
let reportingMembersArray = [req.tokenInfo._doc._id]
level = level - 1;
let reportingMembers = await doctorModel.find({ reportingTo: req.tokenInfo._doc._id }, { _id: 1 });
for (let obj of reportingMembers) {
reportingMembersArray.push(obj._id);
}
if (level > 0) {
var flag = true
while (flag) {
if (reportingMembers && reportingMembers.length > 0) {
let value1 = await doctorService.getDoctors(reportingMembers)
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
// query.filter.reportingTo = req.tokenInfo._doc._id //ofor Doctor crud
query.filter["$or"] = [{ reportingTo: { $in: [req.tokenInfo._doc._id] } }, ];
}
}
}
req.entityType = 'doctor';
query.dbfields = { password: 0, salt: 0, _v: 0 };
if (req.query.type === 'exportToCsv') {
query.limit = (query.pagination.totalCount>200) ? 200 : query.pagination.totalCount
}
 
doctors = await doctorModel.list(query);
if (req.query.type === 'exportToCsv') {
doctors = await exportToCsvViewService.applyCsvHashingToActions(req, doctors);
}
query.pagination.totalCount = await doctorModel.totalCount(query);
 
res.json({
doctors: doctors,
pagination: query.pagination
});
}

/**
 * Create new doctor
 * @param req
 * @param res
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function create(req, res) {
  logger.info('Log:Doctor Controller:create: body :' + JSON.stringify(req.body), controller);

  await serviceUtil.checkPermission(req, res, "Edit", controller);
  if(req.body && req.body.email) req.body.email=req.body.email.toLowerCase()
  let doctor = new doctorModel(req.body);
  let preCreateResult = await preCreate(doctor)
  //check email exists or not
  const uniqueEmail = await doctorModel.findUniqueEmail(doctor.email);
  if (uniqueEmail) {
    req.i18nKey = 'emailExists';
    logger.error('Error:doctor Controller:create:' + i18nUtil.getI18nMessage('emailExists'), controller);
    return res.json(respUtil.getErrorResponse(req));
  }
  let requiredFieldError = await doctorService.requriedFields(req)
  if(requiredFieldError){
    req.i18nKey = 'requriedField';
    return res.json(respUtil.getErrorResponse(req));
  }
  
  
  doctor = await doctorService.setCreateDoctorVariables(req, doctor)
  let validateRes = await doctorService.validateFields(req, req.body);
              if(validateRes){
              return res.json(respUtil.getErrorResponse(req));
            }

  /**@create ListPreference for individual login type */
  let newListPreference = await new listPreferencesModel({columnOrder:config.columnOrder,doctorId:doctor._id});
  /**@Saving the ListPreference */
  let savedPreference = await listPreferencesModel.saveData(newListPreference);
  /**@Assign that Preference to User */
  doctor.listPreferences = savedPreference._id;

  let preSaveCreateResult = await preSaveCreate(doctor)
  req.doctor = await doctorModel.saveData(doctor);
  let postSaveCreateResult = await postSaveCreate(req.doctor)
  req.doctor.password = req.doctor.salt = undefined;
  req.entityType = 'doctor';
  req.activityKey = 'doctorCreate';
  activityService.insertActivity(req);
  if (req.body.email) {
    emailService.sendEmailviaGrid({
        templateName: config.emailTemplates.doctorCreate,
        entityType: sessionUtil.getLoginType(req),
        emailParams: {
            to: req.body.email
            // link: templateInfo.clientUrl + '#/changeRecoverPassword/' + req.token + '?active=true'
        }
    });
}
  //send email to doctor
  // emailService.sendEmail(req, res);
  // let templateInfo = JSON.parse(JSON.stringify(config.mailSettings));
  // emailService.sendEmailviaGrid({
  //   templateName: config.emailTemplates.doctorWelcome,
  //   emailParams: {
  //     to: doctor.email,
  //     displayName: doctor.displayName,
  //     Id: req.doctor._id,
  //     link: templateInfo.adminUrl
  //   }
  // });
  logger.info('Log:doctor Controller:create:' + i18nUtil.getI18nMessage('doctorCreate'), controller);
  return res.json(respUtil.createSuccessResponse(req));
}


/**
 * Update existing doctor
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function update(req, res, next) {
  logger.info('Log:Doctor Controller:update: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let doctor = req.doctor;
  let preUpdateResult = await preUpdate(doctor)
  
  req.description = await serviceUtil.compareObjects(doctor, req.body);
  doctor = Object.assign(doctor, req.body);
  // doctor = _.merge(doctor, req.body);
  // doctor.set(req.body);
  doctor = await doctorService.setUpdateDoctorVariables(req, doctor);
  let validateRes = await doctorService.validateFields(req, req.body);
              if(validateRes){
              return res.json(respUtil.getErrorResponse(req));
            }
  let preSaveUpdateResult = await preSaveUpdate(doctor)
  req.doctor = await doctorModel.saveData(doctor);
  let postSaveUpdateResult = await postSaveUpdate(req.doctor)
  req.entityType = 'doctor';
  req.activityKey = 'doctorUpdate';

  // adding doctor update activity
  activityService.insertActivity(req);
  res.json(respUtil.updateSuccessResponse(req));
}

/**
 * Delete doctor.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function remove(req, res, next) {
  logger.info('Log:Doctor Controller:remove: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let doctor = req.doctor;
  let preRemoveResult = await preRemove(doctor)
  doctor.active = false;
  doctor = await doctorService.setUpdateDoctorVariables(req, doctor);
  let preSaveRemoveResult = await preSaveRemove(doctor)
  req.doctor = await doctorModel.saveData(doctor);
  let postSaveRemoveResult = await postSaveRemove(req.doctor)
  req.entityType = 'doctor';
  req.activityKey = 'doctorDelete';

  // adding doctor delete activity
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
    logger.info('Log:Doctor Controller:multiupdate: query,body :' + JSON.stringify(req.body));
    await serviceUtil.checkPermission(req, res, "Edit", controller);
    if(req.body && req.body.selectedIds && req.body.selectedIds.length > 0  && req.body.updatedDetails){
      await doctorModel.updateMany({ 
        _id:{ $in : req.body.selectedIds }
        },
        { $set: req.body.updatedDetails }
      )
    }
    req.entityType = 'doctor';
    req.activityKey = 'doctorUpdate';
    activityService.insertActivity(req);
    res.json(respUtil.updateSuccessResponse(req));
  }


  const preCreate=async(patient)=>{
 /**@Add Your custom Logic */
}
const preSaveCreate=async(patient)=>{
/**@Add Your custom Logic */
}
const postSaveCreate=async(patient)=>{
/**@Add Your custom Logic */
}
const preUpdate=async(patient)=>{
/**@Add Your custom Logic */
}
const preSaveUpdate=async(patient)=>{
/**@Add Your custom Logic */
}
const postSaveUpdate=async(patient)=>{
/**@Add Your custom Logic */
}
const preRemove=async(patient)=>{
/**@Add Your custom Logic */
}
const preSaveRemove=async(patient)=>{
/**@Add Your custom Logic */
}
const postSaveRemove=async(patient)=>{
/**@Add Your custom Logic */
}



export default {register,multidelete,get,list,load,create,update,remove,multiupdate, getDoctorsBypatients}