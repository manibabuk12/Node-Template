import leaveModel from "../models/leave.model";

import session from "../utils/session.util";
import activityService from "./activity.service";
//replace_encryptedImport
//replace_serviceImport
import employee from "../models/employee.model";

let _ = require("lodash");
/**
 * set Leave variables
 * @returns {leaveModel}
 */
const setCreateLeaveVariables = async (req, leave) => {
  if (req.tokenInfo) {
    leave.createdBy = session.getSessionLoginID(req);
    leave.userId = session.getSessionLoginID(req);
    leave.userName = session.getSessionLoginName(req);
    leave.createdByName = session.getSessionLoginName(req);
    // leave.status = "Pending";
    leave.userEmail = session.getSessionLoginEmail(req);
    //replace_encryptedFields
    //replace_uniqueIdGeneration
  }

  leave.created = Date.now();
  return leave;
};

/**
 * set Leave update variables
 * @returns {leaveModel}
 */
const setUpdateLeaveVariables = async (req, leave) => {
  if (req.tokenInfo) {
    leave.updatedBy = session.getSessionLoginID(req);
    leave.updatedByName = session.getSessionLoginName(req);
  }
  //replace_encryptedFields
  leave.updated = Date.now();
  return leave;
};

/**@RelateAutoComplete for Bulk Upload */
const autoCompleteData = async (obj) => {
  let arrObj = [
    {
      bulkUploadField: "Employee",
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
async function insertLeaveData(req, res) {
  req.duplicates = [];
  let obj = req.obj;
  for (let val in obj) {
    try {
      obj[val] = await autoCompleteData(obj[val]);
      let leave = new leaveModel(obj[val]);
      leave = await setCreateLeaveVariables(req, leave);
      let validateRes = await validateFields(req, leave);
      if (validateRes) {
        obj[val].reason = req.errorMessage;
        req.duplicates.push(obj[val]);
        delete obj[val];
      }

      if (!validateRes) {
        req.leave = await leaveModel.saveData(leave);
        req.entityType = "leave";
        req.activityKey = "leaveCreate";
        await activityService.insertActivity(req);
      }
    } catch (err) {
      obj[val].reason = "Error while creating Leave" + err;
      req.duplicates.push(obj[val]);
      delete obj[val];
    }
  }
  return obj;
}

const validateFields = async (req, leave) => {
  let isError = false;

  //replaceRequiredFields
  return isError;
};

/**@Validate bulkupload fields with csv Headers */
const validateLeaveBulkFields = async (req, res) => {
  let excelHeaders = req.headerKeys;
  let excelData = req.obj;
  req.duplicates = [];
  let bulkuploadFields = [
    "leaveType",
    "status",
    "reason",
    "startDate",
    "endDate",
    "numberofDays",
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
  setCreateLeaveVariables,
  setUpdateLeaveVariables,
  insertLeaveData,
  validateFields,
  validateLeaveBulkFields,
};
