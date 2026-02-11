import constituencyModel from "../models/constituency.model";

import session from "../utils/session.util";
import activityService from "./activity.service";
//replace_encryptedImport
//replace_serviceImport
import employee from "../models/employee.model";

let _ = require("lodash");
/**
 * set Constituency variables
 * @returns {constituencyModel}
 */
const setCreateConstituencyVariables = async (req, constituency) => {
  if (req.tokenInfo) {
    constituency.createdBy = session.getSessionLoginID(req);
    constituency.userId = session.getSessionLoginID(req);
    constituency.userName = session.getSessionLoginName(req);
    constituency.createdByName = session.getSessionLoginName(req);
    // constituency.status = "Pending";
    constituency.userEmail = session.getSessionLoginEmail(req);
    //replace_encryptedFields
    //replace_uniqueIdGeneration
  }

  constituency.created = Date.now();
  return constituency;
};

/**
 * set Constituency update variables
 * @returns {constituencyModel}
 */
const setUpdateConstituencyVariables = async (req, constituency) => {
  if (req.tokenInfo) {
    constituency.updatedBy = session.getSessionLoginID(req);
    constituency.updatedByName = session.getSessionLoginName(req);
  }
  //replace_encryptedFields
  constituency.updated = Date.now();
  return constituency;
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
async function insertConstituencyData(req, res) {
  req.duplicates = [];
  let obj = req.obj;
  for (let val in obj) {
    try {
      obj[val] = await autoCompleteData(obj[val]);
      let constituency = new constituencyModel(obj[val]);
      constituency = await setCreateConstituencyVariables(req, constituency);
      let validateRes = await validateFields(req, constituency);
      if (validateRes) {
        obj[val].reason = req.errorMessage;
        req.duplicates.push(obj[val]);
        delete obj[val];
      }

      if (!validateRes) {
        req.constituency = await constituencyModel.saveData(constituency);
        req.entityType = "constituency";
        req.activityKey = "constituencyCreate";
        await activityService.insertActivity(req);
      }
    } catch (err) {
      obj[val].reason = "Error while creating Constituency" + err;
      req.duplicates.push(obj[val]);
      delete obj[val];
    }
  }
  return obj;
}

const validateFields = async (req, constituency) => {
  let isError = false;

  //replaceRequiredFields
  return isError;
};

/**@Validate bulkupload fields with csv Headers */
const validateConstituencyBulkFields = async (req, res) => {
  let excelHeaders = req.headerKeys;
  let excelData = req.obj;
  req.duplicates = [];
  let bulkuploadFields = [
    "constituencyName",
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
  setCreateConstituencyVariables,
  setUpdateConstituencyVariables,
  insertConstituencyData,
  validateFields,
  validateConstituencyBulkFields,
};
