import taskModel from "../models/task.model";

import session from "../utils/session.util";
import activityService from "./activity.service";
//replace_encryptedImport
//replace_serviceImport
import employee from "../models/employee.model";

let _ = require("lodash");
/**
 * set Task variables
 * @returns {taskModel}
 */
const setCreateTaskVariables = async (req, task) => {
  if (req.tokenInfo) {
    task.createdBy = session.getSessionLoginID(req);
    task.userId = session.getSessionLoginID(req);
    task.userName = session.getSessionLoginName(req);
    task.createdByName = session.getSessionLoginName(req);
    // task.status = "Pending";
    task.userEmail = session.getSessionLoginEmail(req);
    //replace_encryptedFields
    //replace_uniqueIdGeneration
  }

  task.created = Date.now();
  return task;
};

/**
 * set Task update variables
 * @returns {taskModel}
 */
const setUpdateTaskVariables = async (req, task) => {
  if (req.tokenInfo) {
    task.updatedBy = session.getSessionLoginID(req);
    task.updatedByName = session.getSessionLoginName(req);
  }
  //replace_encryptedFields
  task.updated = Date.now();
  return task;
};

/**@RelateAutoComplete for Bulk Upload */
const autoCompleteData = async (obj) => {
  let arrObj = [
    {
      bulkUploadField: "assignedTo",
      secureApi: employee,
      searchField: "name",
      isMultiple: undefined,
    },
  ];
  for (let i of arrObj) {
    if (!i.isMultiple) {
      let query = {};
      query[i.searchField] = obj[i.bulkUploadField];
      query.active = true;
      obj[i.bulkUploadField] = await i.secureApi.findOne(query);
    } else {
      let resultarr = [];
      let searchFields = obj[i.bulkUploadField].split(",");
      for (let j of searchFields) {
        let query = { active: true };
        query[i.searchField] = j.trim();
        let findResult = await i.secureApi.findOne(query);
        if (findResult) resultarr.push(findResult);
      }
      obj[i.bulkUploadField] = resultarr;
    }
    if (obj && !obj[i.bulkUploadField])
      obj.reason = `${i.searchField} is not found`;
    console.log("AUTORELATE-->VAMSIII", obj[i.bulkUploadField]);
  }
  return obj;
};

/**
 * insert Employees bulk data
 * @returns {Employees}
 */
async function insertTaskData(req, res) {
  req.duplicates = [];
  let obj = req.obj;
  for (let val in obj) {
    try {
      obj[val] = await autoCompleteData(obj[val]);
      let task = new taskModel(obj[val]);
      task = await setCreateTaskVariables(req, task);
      let validateRes = await validateFields(req, task);
      if (validateRes) {
        obj[val].reason = req.errorMessage;
        req.duplicates.push(obj[val]);
        delete obj[val];
      }

      if (!validateRes) {
        req.task = await taskModel.saveData(task);
        req.entityType = "task";
        req.activityKey = "taskCreate";
        await activityService.insertActivity(req);
      }
    } catch (err) {
      obj[val].reason = "Error while creating Task" + err;
      req.duplicates.push(obj[val]);
      delete obj[val];
    }
  }
  return obj;
}

const validateFields = async (req, task) => {
  let isError = false;

  //replaceRequiredFields
  return isError;
};

/**@Validate bulkupload fields with csv Headers */
const validateTaskBulkFields = async (req, res) => {
  let excelHeaders = req.headerKeys;
  let excelData = req.obj;
  req.duplicates = [];
  let bulkuploadFields = [
    "taskName",
    "priority",
    "status",
    "estimatedTime",
    "workedHours",
    "serialNo",
    "comment",
  ];
  let unMatchedFields = _.difference(bulkuploadFields, excelHeaders);
  if (unMatchedFields && unMatchedFields.length > 0) {
    excelData = excelData.map((x) => ({ ...x, reason: "Headers not matched" }));
    req.duplicates = excelData;
    return {
      headersNotMatched: true,
      reason: `BulkUpload Fields (${unMatchedFields.join(
        ","
      )}) are Not Matched`,
    };
  }
  return { headersMatched: true };
};

export default {
  setCreateTaskVariables,
  setUpdateTaskVariables,
  insertTaskData,
  validateFields,
  validateTaskBulkFields,
};
