/**Models*/
import taskModel from '../models/task.model';
import projectsModel from '../models/project.model';
import listPreferencesModel from '../models/listPreferences.model.js';
import roleModel from '../models/roles.model';
/**Services*/
import taskService from '../services/task.service';
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


const controller = "Task";

/**
 *  multiDelete task.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function multidelete(req, res, next) {
  logger.info('Log:Task Controller:multidelete: query,body :' + JSON.stringify(req.query, req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  if (req.body && req.body.selectedIds && req.body.selectedIds.length > 0) {
    await taskModel.updateMany(
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
  req.entityType = 'task';
  req.activityKey = 'taskDelete';
  // adding task delete activity
  activityService.insertActivity(req);
  res.json(respUtil.removeSuccessResponse(req));
};

/**
 * Get task
 * @param req
 * @param res
 * @returns {details: Task}
 */
async function get(req, res) {
  logger.info('Log:Task Controller:get: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  res.json({
    details: req.task
  });
}// import { Task } from "mocha";


/**
 * Get task list. based on criteria
 * @param req
 * @param res
 * @param next
 * @returns {tasks: tasks, pagination: pagination}
 */
async function list(req, res, next) {
  let tasks
  logger.info('Log:Task Controller:list: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "View", controller);
  const query = await serviceUtil.generateListQuery(req,"task");  
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
  req.entityType = 'task';
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
  //   tasks = await Task.aggregate(query)

  // } else {
  query.dbfields = { password: 0, salt: 0, _v: 0 };
  if (req.query.type === 'exportToCsv') {
    query.limit = (query.pagination.totalCount>200) ? 200 : query.pagination.totalCount
  }
  tasks = await taskModel.list(query); // textLowerCasePlural
  // }
  if (req.query.type === 'exportToCsv') {
      tasks = await exportToCsvViewService.applyCsvHashingToActions(req, tasks);
  }
  query.pagination.totalCount = await taskModel.totalCount(query);
  res.json({
    tasks: tasks,
    pagination: query.pagination
  });
}


/**
 * Load task and append to req.
 * @param req
 * @param res
 * @param next
 */
async function load(req, res, next) {
  try{
    req.task = await taskModel.get(req.params.taskId);
    return next();
  }catch(err){
    req.i18nKey="idNotFound"
    return res.json(respUtil.getErrorResponse(req))
  }
}

/**
 * Create new task
 * @param req
 * @param res
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function create(req, res) {
  logger.info('Log:Task Controller:create: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let task = new taskModel(req.body); // task // TaskFirst
  let preCreateResult = await preCreate(task)
  
  
  task = await taskService.setCreateTaskVariables(req, task);
  let preSaveCreateResult = await preSaveCreate(task)
  req.task = await taskModel.saveData(task);
  let postSaveCreateResult = await postSaveCreate(req.task)
  req.entityType = 'task';
  req.activityKey = 'taskCreate';
  
  // adding task create activity
  activityService.insertActivity(req);
  res.json(respUtil.createSuccessResponse(req));
}

/**
 * Update existing task
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function update(req, res, next) {
  logger.info('Log:Task Controller:update: body :' + JSON.stringify(req.body));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let task = req.task;
  let preUpdateResult = await preUpdate(task)
  
  req.description = await serviceUtil.compareObjects(task, req.body);
  task = Object.assign(task, req.body);
  // task = _.merge(task, req.body);
  // task.set(req.body);
  task = await taskService.setUpdateTaskVariables(req, task);
  
  let preSaveUpdateResult = await preSaveUpdate(task)
  req.task = await taskModel.saveData(task);
  let postSaveUpdateResult = await postSaveUpdate(req.task)
  req.entityType = 'task';
  req.activityKey = 'taskUpdate';

  // adding task update activity
  activityService.insertActivity(req);
  res.json(respUtil.updateSuccessResponse(req));
}

/**
 * Delete task.
 * @param req
 * @param res
 * @param next
 * @returns { respCode: respCode, respMessage: respMessage }
 */
async function remove(req, res, next) {
  logger.info('Log:Task Controller:remove: query :' + JSON.stringify(req.query));
  await serviceUtil.checkPermission(req, res, "Edit", controller);
  let task = req.task;
  let preRemoveResult = await preRemove(task)
  task.active = false;
  task = await taskService.setUpdateTaskVariables(req, task);
  let preSaveRemoveResult = await preSaveRemove(task)
  req.task = await taskModel.saveData(task);
  let postSaveRemoveResult = await postSaveRemove(req.task)
  req.entityType = 'task';
  req.activityKey = 'taskDelete';

  // adding task delete activity
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
    logger.info('Log:Task Controller:multiupdate: query,body :' + JSON.stringify(req.body));
    await serviceUtil.checkPermission(req, res, "Edit", controller);
    if(req.body && req.body.selectedIds && req.body.selectedIds.length > 0  && req.body.updatedDetails){
      await taskModel.updateMany({ 
        _id:{ $in : req.body.selectedIds }
        },
        { $set: req.body.updatedDetails }
      )
    }
    req.entityType = 'task';
    req.activityKey = 'taskUpdate';
    activityService.insertActivity(req);
    res.json(respUtil.updateSuccessResponse(req));
  }

 const preCreate=async(task)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveCreate=async(task)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveCreate=async(task)=>{
    /**@Add Your custom Logic */
}
const preUpdate=async(task)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveUpdate=async(task)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveUpdate=async(task)=>{
    /**@Add Your custom Logic */
}
const preRemove=async(task)=>{
    /**@Add Your custom Logic */
}  
  
const preSaveRemove=async(task)=>{
    /**@Add Your custom Logic */
} 
  
const postSaveRemove=async(task)=>{
    /**@Add Your custom Logic */
}


export default {multidelete,get,list,load,create,update,remove,multiupdate}