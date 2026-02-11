/**Models*/
import prescriptionModel from '../models/prescription.model.js';
import projectsModel from '../models/project.model.js';
import listPreferencesModel from '../models/listPreferences.model.js';
import roleModel from '../models/roles.model.js';
/**Services*/
import prescriptionService from '../services/prescription.service.js';
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


const controller = "Prescriptions";

/**
 *  multiDelete prescription.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function multidelete(req, res, next) {
  logger.info('Log:Prescription Controller:multidelete: query,body :' + JSON.stringify(req.query, req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  if (req.body && req.body.selectedIds && req.body.selectedIds.length > 0) {
    await prescriptionModel.updateMany(
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
  req.entityType = 'prescription';
  req.activityKey = 'prescriptionDelete';
  // adding prescription delete activity
  activityService.insertActivity(req);
  res.json(respUtil.removeSuccessResponse(req));
};

/**
 * Get prescription
 * @param req
 * @param res
 * @returns {details: Prescription}
 */
async function get(req, res) {
  logger.info('Log:Prescription Controller:get: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  res.json({
    details: req.prescription
  });
}// import { Prescription } from "mocha";


/**
 * Get prescription list. based on criteria
 * @param req
 * @param res
 * @param next
 * @returns {prescriptions: prescriptions, pagination: pagination}
 */
async function list(req, res, next) {
  let prescriptions
  logger.info('Log:Prescription Controller:list: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  const query = await serviceUtil.generateListQuery(req,"prescription");  
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
  req.entityType = 'prescription';
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
  //   prescriptions = await Prescription.aggregate(query)

  // } else {
  query.dbfields = { password: 0, salt: 0, _v: 0 };
  if (req.query.type === 'exportToCsv') {
    query.limit = (query.pagination.totalCount>200) ? 200 : query.pagination.totalCount
  }
  prescriptions = await prescriptionModel.list(query); // textLowerCasePlural
  // }
  if (req.query.type === 'exportToCsv') {
      prescriptions = await exportToCsvViewService.applyCsvHashingToActions(req, prescriptions);
  }
  query.pagination.totalCount = await prescriptionModel.totalCount(query);
  res.json({
    prescriptions: prescriptions,
    pagination: query.pagination
  });
}


/**
 * Load prescription and append to req.
 * @param req
 * @param res
 * @param next
 */
async function load(req, res, next) {
  try{
    req.prescription = await prescriptionModel.get(req.params.prescriptionId);
    return next();
  }catch(err){
    req.i18nKey="idNotFound"
    return res.json(respUtil.getErrorResponse(req))
  }
}

/**
 * Create new prescription
 * @param req
 * @param res
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function create(req, res) {
  logger.info('Log:Prescription Controller:create: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let prescription = new prescriptionModel(req.body); // prescription // PrescriptionFirst
  let preCreateResult = await preCreate(prescription)
  
  
  prescription = await prescriptionService.setCreatePrescriptionVariables(req, prescription);
  let preSaveCreateResult = await preSaveCreate(prescription)
  req.prescription = await prescriptionModel.saveData(prescription);
  let postSaveCreateResult = await postSaveCreate(req.prescription)
  req.entityType = 'prescription';
  req.activityKey = 'prescriptionCreate';
  
  // adding prescription create activity
  activityService.insertActivity(req);
  res.json(respUtil.createSuccessResponse(req));
}

/**
 * Update existing prescription
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function update(req, res, next) {
  logger.info('Log:Prescription Controller:update: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let prescription = req.prescription;
  let preUpdateResult = await preUpdate(prescription)
  
  req.description = await serviceUtil.compareObjects(prescription, req.body);
  prescription = Object.assign(prescription, req.body);
  // prescription = _.merge(prescription, req.body);
  // prescription.set(req.body);
  prescription = await prescriptionService.setUpdatePrescriptionVariables(req, prescription);
  
  let preSaveUpdateResult = await preSaveUpdate(prescription)
  req.prescription = await prescriptionModel.saveData(prescription);
  let postSaveUpdateResult = await postSaveUpdate(req.prescription)
  req.entityType = 'prescription';
  req.activityKey = 'prescriptionUpdate';

  // adding prescription update activity
  activityService.insertActivity(req);
  res.json(respUtil.updateSuccessResponse(req));
}

/**
 * Delete prescription.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function remove(req, res, next) {
  logger.info('Log:Prescription Controller:remove: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let prescription = req.prescription;
  let preRemoveResult = await preRemove(prescription)
  prescription.active = false;
  prescription = await prescriptionService.setUpdatePrescriptionVariables(req, prescription);
  let preSaveRemoveResult = await preSaveRemove(prescription)
  req.prescription = await prescriptionModel.saveData(prescription);
  let postSaveRemoveResult = await postSaveRemove(req.prescription)
  req.entityType = 'prescription';
  req.activityKey = 'prescriptionDelete';

  // adding prescription delete activity
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
    logger.info('Log:Prescription Controller:multiupdate: query,body :' + JSON.stringify(req.body));
    await serviceUtil.checkPermission(req, res, "Edit", controller);
    if(req.body && req.body.selectedIds && req.body.selectedIds.length > 0  && req.body.updatedDetails){
      await prescriptionModel.updateMany({ 
        _id:{ $in : req.body.selectedIds }
        },
        { $set: req.body.updatedDetails }
      )
    }
    req.entityType = 'prescription';
    req.activityKey = 'prescriptionUpdate';
    activityService.insertActivity(req);
    res.json(respUtil.updateSuccessResponse(req));
  }

const preCreate = async (prescription) => {
  /** Normalize string fields */
  if (prescription.name) {
    prescription.name = prescription.name.trim();
  }
  if (prescription.code) {
    prescription.code = prescription.code.trim().toUpperCase();
  }
  if (prescription.email) {
    prescription.email = prescription.email.trim().toLowerCase();
  }

  /** Check for duplicate prescription (by name or code) */
  const duplicateQuery = {
    active: true,
    $or: []
  };

  if (prescription.name) {
    duplicateQuery.$or.push({ name: prescription.name });
  }
  if (prescription.code) {
    duplicateQuery.$or.push({ code: prescription.code });
  }

  // if (duplicateQuery.$or.length > 0) {
  //   const existingPrescription = await prescriptionModel.findOne(duplicateQuery);
  //   if (existingPrescription) {
  //     throw {
  //       i18nKey: 'prescriptionAlreadyExists',
  //       message: 'Prescription with same name or code already exists'
  //     };
  //   }
  // }

  /** Set default values */
  prescription.active = true;

  /** Timestamps (if not handled by mongoose) */
  prescription.created = new Date();
  prescription.updated = new Date();

  return prescription;
};

  
const preSaveCreate = async (prescription) => {
  /** Ensure active flag */
  if (prescription.active === undefined || prescription.active === null) {
    prescription.active = true;
  }

  /** Ensure updated timestamp */
  prescription.updated = new Date();

  /** Generate searchable lowercase fields (if used in list/search) */
  if (prescription.name) {
    prescription.nameLower = prescription.name.toLowerCase();
  }
  if (prescription.code) {
    prescription.codeLower = prescription.code.toLowerCase();
  }

  /** Ensure arrays are initialized */
  if (!Array.isArray(prescription.departments)) {
    prescription.departments = [];
  }

  /** Default status */
  if (!prescription.status) {
    prescription.status = 'Active';
  }

  /** Final defensive duplicate check (race-condition safety) */
  const exists = await prescriptionModel.findOne({
    active: true,
    nameLower: prescription.nameLower
  });

  // if (exists) {
  //   throw {
  //     i18nKey: 'prescriptionAlreadyExists',
  //     message: 'Prescription already exists'
  //   };
  // }

  return prescription;
};

  
const postSaveCreate = async (prescription) => {
  try {
    /** Create default list preferences */
    await listPreferencesModel.create({
      entityType: 'prescription',
      entityId: prescription._id,
      preferences: {},
      active: true,
      created: new Date()
    });

    /** Send notification email (optional) */
    if (prescription.email) {
      await emailService.sendEmail({
        to: prescription.email,
        template: 'prescriptionCreated',
        data: {
          prescriptionName: prescription.name
        }
      });
    }

    /** Any async non-blocking logic can go here */
    // e.g. indexing, audit sync, webhook trigger

  } catch (err) {
    /** DO NOT throw — creation already succeeded */
    logger.error(
      'PostSaveCreate:Prescription failed',
      {
        prescriptionId: prescription._id,
        error: err
      }
    );
  }

  return prescription;
};

const preUpdate=async(prescription)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveUpdate=async(prescription)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveUpdate=async(prescription)=>{
    /**@Add Your custom Logic */
}
const preRemove=async(prescription)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveRemove=async(prescription)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveRemove=async(prescription)=>{
    /**@Add Your custom Logic */
}


export default {multidelete,get,list,load,create,update,remove,multiupdate}