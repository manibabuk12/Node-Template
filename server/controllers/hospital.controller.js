/**Models*/
import hospitalModel from '../models/hospital.model.js';
import projectsModel from '../models/project.model.js';
import listPreferencesModel from '../models/listPreferences.model.js';
import roleModel from '../models/roles.model.js';
/**Services*/
import hospitalService from '../services/hospital.service.js';
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


const controller = "Hospital";

/**
 *  multiDelete hospital.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function multidelete(req, res, next) {
  logger.info('Log:Hospital Controller:multidelete: query,body :' + JSON.stringify(req.query, req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  if (req.body && req.body.selectedIds && req.body.selectedIds.length > 0) {
    await hospitalModel.updateMany(
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
  req.entityType = 'hospital';
  req.activityKey = 'hospitalDelete';
  // adding hospital delete activity
  activityService.insertActivity(req);
  res.json(respUtil.removeSuccessResponse(req));
};

/**
 * Get hospital
 * @param req
 * @param res
 * @returns {details: Hospital}
 */
async function get(req, res) {
  logger.info('Log:Hospital Controller:get: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  res.json({
    details: req.hospital
  });
}// import { Hospital } from "mocha";


/**
 * Get hospital list. based on criteria
 * @param req
 * @param res
 * @param next
 * @returns {hospitals: hospitals, pagination: pagination}
 */
async function list(req, res, next) {
  let hospitals
  logger.info('Log:Hospital Controller:list: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  const query = await serviceUtil.generateListQuery(req,"hospital");  
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
  req.entityType = 'hospital';
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
  //   hospitals = await Hospital.aggregate(query)

  // } else {
  query.dbfields = { password: 0, salt: 0, _v: 0 };
  if (req.query.type === 'exportToCsv') {
    query.limit = (query.pagination.totalCount>200) ? 200 : query.pagination.totalCount
  }
  hospitals = await hospitalModel.list(query); // textLowerCasePlural
  // }
  if (req.query.type === 'exportToCsv') {
      hospitals = await exportToCsvViewService.applyCsvHashingToActions(req, hospitals);
  }
  query.pagination.totalCount = await hospitalModel.totalCount(query);
  res.json({
    hospitals: hospitals,
    pagination: query.pagination
  });
}


/**
 * Load hospital and append to req.
 * @param req
 * @param res
 * @param next
 */
async function load(req, res, next) {
  try{
    req.hospital = await hospitalModel.get(req.params.hospitalId);
    return next();
  }catch(err){
    req.i18nKey="idNotFound"
    return res.json(respUtil.getErrorResponse(req))
  }
}

/**
 * Create new hospital
 * @param req
 * @param res
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function create(req, res) {

  logger.info('Log:Hospital Controller:create: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let hospital = new hospitalModel(req.body); // hospital // HospitalFirst
  let preCreateResult = await preCreate(hospital)
  
  
  hospital = await hospitalService.setCreateHospitalVariables(req, hospital);
  let preSaveCreateResult = await preSaveCreate(hospital)
  req.hospital = await hospitalModel.saveData(hospital);
  let postSaveCreateResult = await postSaveCreate(req.hospital)
  req.entityType = 'hospital';
  req.activityKey = 'hospitalCreate';
  
  // adding hospital create activity
  activityService.insertActivity(req);
  res.json(respUtil.createSuccessResponse(req));
}

/**
 * Update existing hospital
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function update(req, res, next) {
  logger.info('Log:Hospital Controller:update: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let hospital = req.hospital;
  let preUpdateResult = await preUpdate(hospital)
  
  req.description = await serviceUtil.compareObjects(hospital, req.body);
  hospital = Object.assign(hospital, req.body);
  // hospital = _.merge(hospital, req.body);
  // hospital.set(req.body);
  hospital = await hospitalService.setUpdateHospitalVariables(req, hospital);
  
  let preSaveUpdateResult = await preSaveUpdate(hospital)
  req.hospital = await hospitalModel.saveData(hospital);
  let postSaveUpdateResult = await postSaveUpdate(req.hospital)
  req.entityType = 'hospital';
  req.activityKey = 'hospitalUpdate';

  // adding hospital update activity
  activityService.insertActivity(req);
  res.json(respUtil.updateSuccessResponse(req));
}

/**
 * Delete hospital.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function remove(req, res, next) {
  logger.info('Log:Hospital Controller:remove: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let hospital = req.hospital;
  let preRemoveResult = await preRemove(hospital)
  hospital.active = false;
  hospital = await hospitalService.setUpdateHospitalVariables(req, hospital);
  let preSaveRemoveResult = await preSaveRemove(hospital)
  req.hospital = await hospitalModel.saveData(hospital);
  let postSaveRemoveResult = await postSaveRemove(req.hospital)
  req.entityType = 'hospital';
  req.activityKey = 'hospitalDelete';

  // adding hospital delete activity
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
    logger.info('Log:Hospital Controller:multiupdate: query,body :' + JSON.stringify(req.body));
    await serviceUtil.checkPermission(req, res, "Edit", controller);
    if(req.body && req.body.selectedIds && req.body.selectedIds.length > 0  && req.body.updatedDetails){
      await hospitalModel.updateMany({ 
        _id:{ $in : req.body.selectedIds }
        },
        { $set: req.body.updatedDetails }
      )
    }
    req.entityType = 'hospital';
    req.activityKey = 'hospitalUpdate';
    activityService.insertActivity(req);
    res.json(respUtil.updateSuccessResponse(req));
  }

const preCreate = async (hospital) => {
  /** Normalize string fields */
  if (hospital.name) {
    hospital.name = hospital.name.trim();
  }
  if (hospital.code) {
    hospital.code = hospital.code.trim().toUpperCase();
  }
  if (hospital.email) {
    hospital.email = hospital.email.trim().toLowerCase();
  }

  /** Check for duplicate hospital (by name or code) */
  const duplicateQuery = {
    active: true,
    $or: []
  };

  if (hospital.name) {
    duplicateQuery.$or.push({ name: hospital.name });
  }
  if (hospital.code) {
    duplicateQuery.$or.push({ code: hospital.code });
  }

  if (duplicateQuery.$or.length > 0) {
    const existingHospital = await hospitalModel.findOne(duplicateQuery);
    if (existingHospital) {
      throw {
        i18nKey: 'hospitalAlreadyExists',
        message: 'Hospital with same name or code already exists'
      };
    }
  }

  /** Set default values */
  hospital.active = true;

  /** Timestamps (if not handled by mongoose) */
  hospital.created = new Date();
  hospital.updated = new Date();

  return hospital;
};

  
const preSaveCreate = async (hospital) => {
  /** Ensure active flag */
  if (hospital.active === undefined || hospital.active === null) {
    hospital.active = true;
  }

  /** Ensure updated timestamp */
  hospital.updated = new Date();

  /** Generate searchable lowercase fields (if used in list/search) */
  if (hospital.name) {
    hospital.nameLower = hospital.name.toLowerCase();
  }
  if (hospital.code) {
    hospital.codeLower = hospital.code.toLowerCase();
  }

  /** Ensure arrays are initialized */
  if (!Array.isArray(hospital.departments)) {
    hospital.departments = [];
  }

  /** Default status */
  if (!hospital.status) {
    hospital.status = 'Active';
  }

  /** Final defensive duplicate check (race-condition safety) */
  const exists = await hospitalModel.findOne({
    active: true,
    nameLower: hospital.nameLower
  });

  if (exists) {
    throw {
      i18nKey: 'hospitalAlreadyExists',
      message: 'Hospital already exists'
    };
  }

  return hospital;
};

  
const postSaveCreate = async (hospital) => {
  try {
    /** Create default list preferences */
    await listPreferencesModel.create({
      entityType: 'hospital',
      entityId: hospital._id,
      preferences: {},
      active: true,
      created: new Date()
    });

    /** Send notification email (optional) */
    if (hospital.email) {
      await emailService.sendEmail({
        to: hospital.email,
        template: 'hospitalCreated',
        data: {
          hospitalName: hospital.name
        }
      });
    }

    /** Any async non-blocking logic can go here */
    // e.g. indexing, audit sync, webhook trigger

  } catch (err) {
    /** DO NOT throw — creation already succeeded */
    logger.error(
      'PostSaveCreate:Hospital failed',
      {
        hospitalId: hospital._id,
        error: err
      }
    );
  }

  return hospital;
};

export default {multidelete,get,list,load,create,update,remove,multiupdate}