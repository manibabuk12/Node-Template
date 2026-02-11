import voterModel from "../models/voter.model";

import session from "../utils/session.util";
import activityService from "./activity.service";
//replace_encryptedImport
//replace_serviceImport
import employee from "../models/employee.model";

let _ = require("lodash");
/**
 * set Voter variables
 * @returns {voterModel}
 */
const setCreateVoterVariables = async (req, voter) => {
  if (req.tokenInfo) {
    voter.createdBy = session.getSessionLoginID(req);
    voter.userId = session.getSessionLoginID(req);
    voter.userName = session.getSessionLoginName(req);
    voter.createdByName = session.getSessionLoginName(req);
    // voter.status = "Pending";
    voter.userEmail = session.getSessionLoginEmail(req);
    //replace_encryptedFields
    //replace_uniqueIdGeneration
  }

  voter.created = Date.now();
  return voter;
};

/**
 * set Voter update variables
 * @returns {voterModel}
 */
const setUpdateVoterVariables = async (req, voter) => {
  if (req.tokenInfo) {
    voter.updatedBy = session.getSessionLoginID(req);
    voter.updatedByName = session.getSessionLoginName(req);
  }
  //replace_encryptedFields
  voter.updated = Date.now();
  return voter;
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
async function insertVoterData(req, res) {
  req.duplicates = [];
  let obj = req.obj;
  for (let val in obj) {
    try {
      obj[val] = await autoCompleteData(obj[val]);
      let voter = new voterModel(obj[val]);
      voter = await setCreateVoterVariables(req, voter);
      let validateRes = await validateFields(req, voter);
      if (validateRes) {
        obj[val].reason = req.errorMessage;
        req.duplicates.push(obj[val]);
        delete obj[val];
      }

      if (!validateRes) {
        req.voter = await voterModel.saveData(voter);
        req.entityType = "voter";
        req.activityKey = "voterCreate";
        await activityService.insertActivity(req);
      }
    } catch (err) {
      obj[val].reason = "Error while creating Voter" + err;
      req.duplicates.push(obj[val]);
      delete obj[val];
    }
  }
  return obj;
}

const validateFields = async (req, voter) => {
  let isError = false;

  //replaceRequiredFields
  return isError;
};

/**@Validate bulkupload fields with csv Headers */
const validateVoterBulkFields = async (req, res) => {
  let excelHeaders = req.headerKeys;
  let excelData = req.obj;
  req.duplicates = [];
  let bulkuploadFields = [
    "voterName",
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
  setCreateVoterVariables,
  setUpdateVoterVariables,
  insertVoterData,
  validateFields,
  validateVoterBulkFields,
};
