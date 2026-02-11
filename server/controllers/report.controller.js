/**Models*/
import reportModel from '../models/report.model.js';
import projectsModel from '../models/project.model.js';
import listPreferencesModel from '../models/listPreferences.model.js';
import roleModel from '../models/roles.model.js';
/**Services*/
import reportService from '../services/report.service.js';
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


const controller = "Report";

/**
 *  multiDelete report.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function multidelete(req, res, next) {
  logger.info('Log:Report Controller:multidelete: query,body :' + JSON.stringify(req.query, req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  if (req.body && req.body.selectedIds && req.body.selectedIds.length > 0) {
    await reportModel.updateMany(
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
  req.entityType = 'report';
  req.activityKey = 'reportDelete';
  // adding report delete activity
  activityService.insertActivity(req);
  res.json(respUtil.removeSuccessResponse(req));
};

/**
 * Get report
 * @param req
 * @param res
 * @returns {details: Report}
 */
async function get(req, res) {
  logger.info('Log:Report Controller:get: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  res.json({
    details: req.report
  });
}// import { Report } from "mocha";


/**
 * Get report list. based on criteria
 * @param req
 * @param res
 * @param next
 * @returns {reports: reports, pagination: pagination}
 */
async function list(req, res, next) {
  let reports
  logger.info('Log:Report Controller:list: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  const query = await serviceUtil.generateListQuery(req,"report");  
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
  req.entityType = 'report';
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
  //   reports = await Report.aggregate(query)

  // } else {
  query.dbfields = { password: 0, salt: 0, _v: 0 };
  if (req.query.type === 'exportToCsv') {
    query.limit = (query.pagination.totalCount>200) ? 200 : query.pagination.totalCount
  }
  reports = await reportModel.list(query); // textLowerCasePlural
  // }
  if (req.query.type === 'exportToCsv') {
      reports = await exportToCsvViewService.applyCsvHashingToActions(req, reports);
  }
  query.pagination.totalCount = await reportModel.totalCount(query);
  res.json({
    reports: reports,
    pagination: query.pagination
  });
}


/**
 * Load report and append to req.
 * @param req
 * @param res
 * @param next
 */
async function load(req, res, next) {
  try{
    req.report = await reportModel.get(req.params.reportId);
    return next();
  }catch(err){
    req.i18nKey="idNotFound"
    return res.json(respUtil.getErrorResponse(req))
  }
}

/**
 * Create new report
 * @param req
 * @param res
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function create(req, res) {
  logger.info('Log:Report Controller:create: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let report = new reportModel(req.body); // report // ReportFirst
  let preCreateResult = await preCreate(report)
  
  
  report = await reportService.setCreateReportVariables(req, report);
  let preSaveCreateResult = await preSaveCreate(report)
  req.report = await reportModel.saveData(report);
  let postSaveCreateResult = await postSaveCreate(req.report)
  req.entityType = 'report';
  req.activityKey = 'reportCreate';
  
  // adding report create activity
  activityService.insertActivity(req);
  res.json(respUtil.createSuccessResponse(req));
 
}

/**
 * Update existing report
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function update(req, res, next) {
  logger.info('Log:Report Controller:update: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let report = req.report;
  let preUpdateResult = await preUpdate(report)
  
  req.description = await serviceUtil.compareObjects(report, req.body);
  report = Object.assign(report, req.body);
  // report = _.merge(report, req.body);
  // report.set(req.body);
  report = await reportService.setUpdateReportVariables(req, report);
  
  let preSaveUpdateResult = await preSaveUpdate(report)
  req.report = await reportModel.saveData(report);
  let postSaveUpdateResult = await postSaveUpdate(req.report)
  req.entityType = 'report';
  req.activityKey = 'reportUpdate';

  // adding report update activity
  activityService.insertActivity(req);
  res.json(respUtil.updateSuccessResponse(req));
}

/**
 * Delete report.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function remove(req, res, next) {
  logger.info('Log:Report Controller:remove: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let report = req.report;
  let preRemoveResult = await preRemove(report)
  report.active = false;
  report = await reportService.setUpdateReportVariables(req, report);
  let preSaveRemoveResult = await preSaveRemove(report)
  req.report = await reportModel.saveData(report);
  let postSaveRemoveResult = await postSaveRemove(req.report)
  req.entityType = 'report';
  req.activityKey = 'reportDelete';

  // adding report delete activity
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
    logger.info('Log:Report Controller:multiupdate: query,body :' + JSON.stringify(req.body));
    await serviceUtil.checkPermission(req, res, "Edit", controller);
    if(req.body && req.body.selectedIds && req.body.selectedIds.length > 0  && req.body.updatedDetails){
      await reportModel.updateMany({ 
        _id:{ $in : req.body.selectedIds }
        },
        { $set: req.body.updatedDetails }
      )
    }
    req.entityType = 'report';
    req.activityKey = 'reportUpdate';
    activityService.insertActivity(req);
    res.json(respUtil.updateSuccessResponse(req));
  }

const preCreate = async (report) => {
  /** Normalize string fields */
  if (report.name) {
    report.name = report.name.trim();
  }
  if (report.code) {
    report.code = report.code.trim().toUpperCase();
  }
  if (report.email) {
    report.email = report.email.trim().toLowerCase();
  }

  /** Check for duplicate report (by name or code) */
  const duplicateQuery = {
    active: true,
    $or: []
  };

  if (report.name) {
    duplicateQuery.$or.push({ name: report.name });
  }
  if (report.code) {
    duplicateQuery.$or.push({ code: report.code });
  }

  if (duplicateQuery.$or.length > 0) {
    const existingReport = await reportModel.findOne(duplicateQuery);
    if (existingReport) {
      throw {
        i18nKey: 'reportAlreadyExists',
        message: 'Report with same name or code already exists'
      };
    }
  }

  /** Set default values */
  report.active = true;

  /** Timestamps (if not handled by mongoose) */
  report.created = new Date();
  report.updated = new Date();

  return report;
};

  
const preSaveCreate = async (report) => {
  /** Ensure active flag */
  if (report.active === undefined || report.active === null) {
    report.active = true;
  }

  /** Ensure updated timestamp */
  report.updated = new Date();

  /** Generate searchable lowercase fields (if used in list/search) */
  if (report.name) {
    report.nameLower = report.name.toLowerCase();
  }
  if (report.code) {
    report.codeLower = report.code.toLowerCase();
  }

  /** Ensure arrays are initialized */
  if (!Array.isArray(report.departments)) {
    report.departments = [];
  }

  /** Default status */
  if (!report.status) {
    report.status = 'Active';
  }

  /** Final defensive duplicate check (race-condition safety) */
  const exists = await reportModel.findOne({
    active: true,
    nameLower: report.nameLower
  });

  if (exists) {
    throw {
      i18nKey: 'reportAlreadyExists',
      message: 'Report already exists'
    };
  }

  return report;
};

  
const postSaveCreate = async (report) => {
  try {
    /** Create default list preferences */
    await listPreferencesModel.create({
      entityType: 'report',
      entityId: report._id,
      preferences: {},
      active: true,
      created: new Date()
    });

    /** Send notification email (optional) */
    if (report.email) {
      await emailService.sendEmail({
        to: report.email,
        template: 'reportCreated',
        data: {
          reportName: report.name
        }
      });
    }

    /** Any async non-blocking logic can go here */
    // e.g. indexing, audit sync, webhook trigger

  } catch (err) {
    /** DO NOT throw — creation already succeeded */
    logger.error(
      'PostSaveCreate:Report failed',
      {
        reportId: report._id,
        error: err
      }
    );
  }

  return report;
};


export default {multidelete,get,list,load,create,update,remove,multiupdate}