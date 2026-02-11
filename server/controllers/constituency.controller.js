/**Models*/
import constituencyModel from '../models/constituency.model.js';
import projectsModel from '../models/project.model.js';
import listPreferencesModel from '../models/listPreferences.model.js';
import roleModel from '../models/roles.model.js';
/**Services*/
import constituencyService from '../services/constituency.service.js';
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


const controller = "Constituency";
/**
 *  multiDelete constituency.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function multidelete(req, res, next) {
  logger.info('Log:Constituency Controller:multidelete: query,body :' + JSON.stringify(req.query, req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  if (req.body && req.body.selectedIds && req.body.selectedIds.length > 0) {
    await constituencyModel.updateMany(
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
  req.entityType = 'constituency';
  req.activityKey = 'constituencyDelete';
  // adding constituency delete activity
  activityService.insertActivity(req);
  res.json(respUtil.removeSuccessResponse(req));
};

/**
 * Get constituency
 * @param req
 * @param res
 * @returns {details: Constituency}
 */
async function get(req, res) {
  logger.info('Log:Constituency Controller:get: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  res.json({
    details: req.constituency
  });
}// import { Constituency } from "mocha";


/**
 * Get constituency list. based on criteria
 * @param req
 * @param res
 * @param next
 * @returns {constituencys: constituencys, pagination: pagination}
 */
async function list(req, res, next) {
  let constituencys
  logger.info('Log:Constituency Controller:list: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  const query = await serviceUtil.generateListQuery(req,"constituency");  
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
  req.entityType = 'constituency';
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
  //   constituencys = await Constituency.aggregate(query)

  // } else {
  query.dbfields = { password: 0, salt: 0, _v: 0 };
  if (req.query.type === 'exportToCsv') {
    query.limit = (query.pagination.totalCount>200) ? 200 : query.pagination.totalCount
  }
  constituencys = await constituencyModel.list(query); // textLowerCasePlural
  // }
  if (req.query.type === 'exportToCsv') {
      constituencys = await exportToCsvViewService.applyCsvHashingToActions(req, constituencys);
  }
  query.pagination.totalCount = await constituencyModel.totalCount(query);
  res.json({
    constituencys: constituencys,
    pagination: query.pagination
  });
}


/**
 * Load constituency and append to req.
 * @param req
 * @param res
 * @param next
 */
async function load(req, res, next) {
  try{
    req.constituency = await constituencyModel.get(req.params.constituencyId);
    return next();
  }catch(err){
    req.i18nKey="idNotFound"
    return res.json(respUtil.getErrorResponse(req))
  }
}

/**
 * Create new constituency
 * @param req
 * @param res
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function create(req, res) {

  logger.info('Log:Constituency Controller:create: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let constituency = new constituencyModel(req.body); // constituency // ConstituencyFirst
  let preCreateResult = await preCreate(constituency)
  
  
  constituency = await constituencyService.setCreateConstituencyVariables(req, constituency);
  let preSaveCreateResult = await preSaveCreate(constituency)
  req.constituency = await constituencyModel.saveData(constituency);
  let postSaveCreateResult = await postSaveCreate(req.constituency)
  req.entityType = 'constituency';
  req.activityKey = 'constituencyCreate';
  
  // adding constituency create activity
  activityService.insertActivity(req);
  res.json(respUtil.createSuccessResponse(req));
}

/**
 * Update existing constituency
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function update(req, res, next) {
  logger.info('Log:Constituency Controller:update: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let constituency = req.constituency;
  let preUpdateResult = await preUpdate(constituency)
  
  req.description = await serviceUtil.compareObjects(constituency, req.body);
  constituency = Object.assign(constituency, req.body);
  // constituency = _.merge(constituency, req.body);
  // constituency.set(req.body);
  constituency = await constituencyService.setUpdateConstituencyVariables(req, constituency);
  
  let preSaveUpdateResult = await preSaveUpdate(constituency)
  req.constituency = await constituencyModel.saveData(constituency);
  let postSaveUpdateResult = await postSaveUpdate(req.constituency)
  req.entityType = 'constituency';
  req.activityKey = 'constituencyUpdate';

  // adding constituency update activity
  activityService.insertActivity(req);
  res.json(respUtil.updateSuccessResponse(req));
}

/**
 * Delete constituency.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function remove(req, res, next) {
  logger.info('Log:Constituency Controller:remove: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let constituency = req.constituency;
  let preRemoveResult = await preRemove(constituency)
  constituency.active = false;
  constituency = await constituencyService.setUpdateConstituencyVariables(req, constituency);
  let preSaveRemoveResult = await preSaveRemove(constituency)
  req.constituency = await constituencyModel.saveData(constituency);
  let postSaveRemoveResult = await postSaveRemove(req.constituency)
  req.entityType = 'constituency';
  req.activityKey = 'constituencyDelete';

  // adding constituency delete activity
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
    logger.info('Log:Constituency Controller:multiupdate: query,body :' + JSON.stringify(req.body));
    await serviceUtil.checkPermission(req, res, "Edit", controller);
    if(req.body && req.body.selectedIds && req.body.selectedIds.length > 0  && req.body.updatedDetails){
      await constituencyModel.updateMany({ 
        _id:{ $in : req.body.selectedIds }
        },
        { $set: req.body.updatedDetails }
      )
    }
    req.entityType = 'constituency';
    req.activityKey = 'constituencyUpdate';
    activityService.insertActivity(req);
    res.json(respUtil.updateSuccessResponse(req));
  }

const preCreate = async (constituency) => {
  /** Normalize string fields */
  if (constituency.name) {
    constituency.name = constituency.name.trim();
  }
  if (constituency.code) {
    constituency.code = constituency.code.trim().toUpperCase();
  }
  if (constituency.email) {
    constituency.email = constituency.email.trim().toLowerCase();
  }

  /** Check for duplicate constituency (by name or code) */
  const duplicateQuery = {
    active: true,
    $or: []
  };

  if (constituency.name) {
    duplicateQuery.$or.push({ name: constituency.name });
  }
  if (constituency.code) {
    duplicateQuery.$or.push({ code: constituency.code });
  }

  if (duplicateQuery.$or.length > 0) {
    const existingConstituency = await constituencyModel.findOne(duplicateQuery);
    if (existingConstituency) {
      throw {
        i18nKey: 'constituencyAlreadyExists',
        message: 'Constituency with same name or code already exists'
      };
    }
  }

  /** Set default values */
  constituency.active = true;

  /** Timestamps (if not handled by mongoose) */
  constituency.created = new Date();
  constituency.updated = new Date();

  return constituency;
};

  
const preSaveCreate = async (constituency) => {
  /** Ensure active flag */
  if (constituency.active === undefined || constituency.active === null) {
    constituency.active = true;
  }

  /** Ensure updated timestamp */
  constituency.updated = new Date();

  /** Generate searchable lowercase fields (if used in list/search) */
  if (constituency.name) {
    constituency.nameLower = constituency.name.toLowerCase();
  }
  if (constituency.code) {
    constituency.codeLower = constituency.code.toLowerCase();
  }

  /** Ensure arrays are initialized */
  if (!Array.isArray(constituency.departments)) {
    constituency.departments = [];
  }

  /** Default status */
  if (!constituency.status) {
    constituency.status = 'Active';
  }

  /** Final defensive duplicate check (race-condition safety) */
  const exists = await constituencyModel.findOne({
    active: true,
    nameLower: constituency.nameLower
  });

  if (exists) {
    throw {
      i18nKey: 'constituencyAlreadyExists',
      message: 'Constituency already exists'
    };
  }

  return constituency;
};

  
const postSaveCreate = async (constituency) => {
  try {
    /** Create default list preferences */
    await listPreferencesModel.create({
      entityType: 'constituency',
      entityId: constituency._id,
      preferences: {},
      active: true,
      created: new Date()
    });

    /** Send notification email (optional) */
    if (constituency.email) {
      await emailService.sendEmail({
        to: constituency.email,
        template: 'constituencyCreated',
        data: {
          constituencyName: constituency.name
        }
      });
    }

    /** Any async non-blocking logic can go here */
    // e.g. indexing, audit sync, webhook trigger

  } catch (err) {
    /** DO NOT throw — creation already succeeded */
    logger.error(
      'PostSaveCreate:Constituency failed',
      {
        constituencyId: constituency._id,
        error: err
      }
    );
  }

  return constituency;
};

export default {multidelete,get,list,load,create,update,remove,multiupdate}