/**Models*/
import patientModel from '../models/patient.model.js';
import roleModel from '../models/roles.model.js';
import listPreferencesModel from '../models/listPreferences.model.js';
/**Services*/
import patientService from '../services/patient.service.js';
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


const controller = "Patients";

/**
 * Create new patient
 * @param req
 * @param res
 * @returns { respCode: respCode, respMessage: respMessage }
 */
 async function register(req, res) {
    logger.info('Log:Patient Controller:register: body :' + JSON.stringify(req.body), controller);

    console.log("come from patient controller================",req.body)
  
    await serviceUtil.checkPermission(req, res, "Edit", controller);
    if(req.body && req.body.email) req.body.email=req.body.email.toLowerCase()
    let patient = new patientModel(req.body);
  
    //check email exists or not
    const uniqueEmail = await patientModel.findUniqueEmail(patient.email);
    if (uniqueEmail) {
      req.i18nKey = 'emailExists';
      logger.error('Error:patient Controller:register:' + i18nUtil.getI18nMessage('emailExists'), controller);
      return res.json(respUtil.getErrorResponse(req));
    }
    let requiredFieldError = await patientService.requriedFields(req)
    if(requiredFieldError){
      req.i18nKey = 'requriedField';
      return res.json(respUtil.getErrorResponse(req));
    }
    
    /*replace_*validateFieldData*/
    patient = await patientService.setCreatePatientVariables(req, patient)

    /**@create ListPreference for individual login type */
    let newListPreference = await new listPreferencesModel({columnOrder:config.columnOrder,patientId:patient._id});
    /**@Saving the ListPreference */
    let savedPreference = await listPreferencesModel.saveData(newListPreference);
    /**@Assign that Preference to User */
    patient.listPreferences = savedPreference._id;

    req.patient = await patientModel.saveData(patient);
    req.patient.password = req.patient.salt = undefined;
    req.entityType = 'patient';
    req.activityKey = 'patientRegister';
    activityService.insertActivity(req);
    if (req.body.email) {
    emailService.sendEmailviaGrid({
        templateName: config.emailTemplates.patientCreate,
        entityType: sessionUtil.getLoginType(req),
        emailParams: {
            to: req.body.email
            // link: templateInfo.clientUrl + '#/changeRecoverPassword/' + req.token + '?active=true'
        }
    });
}
    //send email to patient
    // emailService.sendEmail(req, res);
    // let templateInfo = JSON.parse(JSON.stringify(config.mailSettings));
    // emailService.sendEmailviaGrid({
    //   templateName: config.emailTemplates.patientWelcome,
    //   emailParams: {
    //     to: patient.email,
    //     displayName: patient.displayName,
    //     Id: req.patient._id,
    //     link: templateInfo.adminUrl
    //   }
    // });
    logger.info('Log:patient Controller:register:' + i18nUtil.getI18nMessage('patientCreate'), controller);
    return res.json(respUtil.createSuccessResponse(req));
  }
  
/**
 *  auth-multiDelete patient.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function multidelete(req, res, next) {
  logger.info('Log:Patient Controller:multidelete: query,body :' + JSON.stringify(req.query, req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  if (req.body && req.body.selectedIds && req.body.selectedIds.length > 0) {
    const validation = await checkOwnRecordIdExists(req);
    if (validation.isError) {
      return res.json(respUtil.getErrorResponse(req));
    }
    await patientModel.updateMany(
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
  req.entityType = 'patient';
  req.activityKey = 'patientDelete';
  // adding patient delete activity
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
 * Get patient
 * @param req
 * @param res
 * @returns {details: Patient}
 */
async function get(req, res) {
  logger.info('Log:Patient Controller:get: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  res.json({
    details: req.patient
  });
}// import { Patient } from "mocha";


/**
 * Get patient list. based on criteria
 * @param req
 * @param res
 * @param next
 * @returns {patients: patients, pagination: pagination}
 */
async function list(req, res, next) {
  let patients
  logger.info('Log:Patient Controller:list: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  const query = await serviceUtil.generateListQuery(req,"patient");  
  // if (req.tokenInfo && req.tokenInfo._doc._id && req.tokenInfo._doc.role && req.tokenInfo._doc.role != 'Admin') {
  //   query.filter.createdBy = req.tokenInfo._id
  // }
  let roleDetails = {}
  if (req.tokenInfo && req.tokenInfo._doc && req.tokenInfo._doc.role) {
    roleDetails = await roleModel.findOne({ role: req.tokenInfo._doc.role, active:true })
  }
  if (!req.query.searchFrom) {
    if (req.tokenInfo && req.tokenInfo._doc && req.tokenInfo._doc._id && roleDetails && roleDetails.roleType && roleDetails.roleType === "Patient") {
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
        let reportingMembers = await patientModel.find({ reportingTo: req.tokenInfo._doc._id }, { _id: 1 });
        for (let obj of reportingMembers) {
          reportingMembersArray.push(obj._id);
        }
        if (level > 0) {
          var flag = true
          while (flag) {
            if (reportingMembers && reportingMembers.length > 0) {
              let value1 = await patientService.getPatients(reportingMembers)
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
        // query.filter.reportingTo = req.tokenInfo._doc._id //ofor Patient crud
        query.filter["$or"] = [{ reportingTo: { $in: [req.tokenInfo._doc._id] } }, ];
      }
    }
  }
  
  req.entityType = 'patient';
  query.dbfields = { password: 0, salt: 0, _v: 0 };
  if (req.query.type === 'exportToCsv') {
    query.limit = (query.pagination.totalCount>200) ? 200 : query.pagination.totalCount
  }

  // patients = await patientModel.list(query);
  if (req.query.type === 'exportToCsv') {
    patients = await exportToCsvViewService.applyCsvHashingToActions(req, patients);
  }
  query.pagination.totalCount = await patientModel.totalCount(query);

  res.json({
    patients: patients,
    pagination: query.pagination
  });
}




/**
 * Load patient and append to req.
 * @param req
 * @param res
 * @param next
 */
async function load(req, res, next) {
  try{
    req.patient = await patientModel.get(req.params.patientId);
    return next();
  }catch(err){
    req.i18nKey="idNotFound"
    return res.json(respUtil.getErrorResponse(req))
  }
}

/**
 * Create new patient
 * @param req
 * @param res
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function create(req, res) {
  logger.info('Log:Patient Controller:create: body :' + JSON.stringify(req.body), controller);

  await serviceUtil.checkPermission(req, res, "Edit", controller);
  if(req.body && req.body.email) req.body.email=req.body.email.toLowerCase()
  let patient = new patientModel(req.body);
  let preCreateResult = await preCreate(patient)
  //check email exists or not
  const uniqueEmail = await patientModel.findUniqueEmail(patient.email);
  if (uniqueEmail) {
    req.i18nKey = 'emailExists';
    logger.error('Error:patient Controller:create:' + i18nUtil.getI18nMessage('emailExists'), controller);
    return res.json(respUtil.getErrorResponse(req));
  }
  let requiredFieldError = await patientService.requriedFields(req)
  if(requiredFieldError){
    req.i18nKey = 'requriedField';
    return res.json(respUtil.getErrorResponse(req));
  }
  
  
  patient = await patientService.setCreatePatientVariables(req, patient)
  let validateRes = await patientService.validateFields(req, req.body);
              if(validateRes){
              return res.json(respUtil.getErrorResponse(req));
            }

  /**@create ListPreference for individual login type */
  let newListPreference = await new listPreferencesModel({columnOrder:config.columnOrder,patientId:patient._id});
  /**@Saving the ListPreference */
  let savedPreference = await listPreferencesModel.saveData(newListPreference);
  /**@Assign that Preference to User */
  patient.listPreferences = savedPreference._id;

  let preSaveCreateResult = await preSaveCreate(patient)
  req.patient = await patientModel.saveData(patient);
  let postSaveCreateResult = await postSaveCreate(req.patient)
  req.patient.password = req.patient.salt = undefined;
  req.entityType = 'patient';
  req.activityKey = 'patientCreate';
  activityService.insertActivity(req);
  if (req.body.email) {
    emailService.sendEmailviaGrid({
        templateName: config.emailTemplates.patientCreate,
        entityType: sessionUtil.getLoginType(req),
        emailParams: {
            to: req.body.email
            // link: templateInfo.clientUrl + '#/changeRecoverPassword/' + req.token + '?active=true'
        }
    });
}
  //send email to patient
  // emailService.sendEmail(req, res);
  // let templateInfo = JSON.parse(JSON.stringify(config.mailSettings));
  // emailService.sendEmailviaGrid({
  //   templateName: config.emailTemplates.patientWelcome,
  //   emailParams: {
  //     to: patient.email,
  //     displayName: patient.displayName,
  //     Id: req.patient._id,
  //     link: templateInfo.adminUrl
  //   }
  // });
  logger.info('Log:patient Controller:create:' + i18nUtil.getI18nMessage('patientCreate'), controller);
  return res.json(respUtil.createSuccessResponse(req));
}


/**
 * Update existing patient
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function update(req, res, next) {
  logger.info('Log:Patient Controller:update: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let patient = req.patient;
  let preUpdateResult = await preUpdate(patient)
  
  req.description = await serviceUtil.compareObjects(patient, req.body);
  patient = Object.assign(patient, req.body);
  // patient = _.merge(patient, req.body);
  // patient.set(req.body);
  patient = await patientService.setUpdatePatientVariables(req, patient);
  let validateRes = await patientService.validateFields(req, req.body);
              if(validateRes){
              return res.json(respUtil.getErrorResponse(req));
            }
  let preSaveUpdateResult = await preSaveUpdate(patient)
  req.patient = await patientModel.saveData(patient);
  let postSaveUpdateResult = await postSaveUpdate(req.patient)
  req.entityType = 'patient';
  req.activityKey = 'patientUpdate';

  // adding patient update activity
  activityService.insertActivity(req);
  res.json(respUtil.updateSuccessResponse(req));
}

/**
 * Delete patient.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function remove(req, res, next) {
  logger.info('Log:Patient Controller:remove: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let patient = req.patient;
  let preRemoveResult = await preRemove(patient)
  patient.active = false;
  patient = await patientService.setUpdatePatientVariables(req, patient);
  let preSaveRemoveResult = await preSaveRemove(patient)
  req.patient = await patientModel.saveData(patient);
  let postSaveRemoveResult = await postSaveRemove(req.patient)
  req.entityType = 'patient';
  req.activityKey = 'patientDelete';

  // adding patient delete activity
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
    logger.info('Log:Patient Controller:multiupdate: query,body :' + JSON.stringify(req.body));
    await serviceUtil.checkPermission(req, res, "Edit", controller);
    if(req.body && req.body.selectedIds && req.body.selectedIds.length > 0  && req.body.updatedDetails){
      await patientModel.updateMany({ 
        _id:{ $in : req.body.selectedIds }
        },
        { $set: req.body.updatedDetails }
      )
    }
    req.entityType = 'patient';
    req.activityKey = 'patientUpdate';
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

export default {register,multidelete,get,list,load,create,update,remove,multiupdate}