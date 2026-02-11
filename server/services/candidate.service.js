import candidateModel from "../models/candidate.model";

import session from "../utils/session.util";
import activityService from "./activity.service";
//replace_encryptedImport
//replace_serviceImport
import employee from "../models/employee.model";

let _ = require("lodash");
/**
 * set Candidate variables
 * @returns {candidateModel}
 */
const setCreateCandidateVariables = async (req, candidate) => {
  if (req.tokenInfo) {
    candidate.createdBy = session.getSessionLoginID(req);
    candidate.userId = session.getSessionLoginID(req);
    candidate.userName = session.getSessionLoginName(req);
    candidate.createdByName = session.getSessionLoginName(req);
    // candidate.status = "Pending";
    candidate.userEmail = session.getSessionLoginEmail(req);
    //replace_encryptedFields
    //replace_uniqueIdGeneration
  }

  candidate.created = Date.now();
  return candidate;
};

/**
 * set Candidate update variables
 * @returns {candidateModel}
 */
const setUpdateCandidateVariables = async (req, candidate) => {
  if (req.tokenInfo) {
    candidate.updatedBy = session.getSessionLoginID(req);
    candidate.updatedByName = session.getSessionLoginName(req);
  }
  //replace_encryptedFields
  candidate.updated = Date.now();
  return candidate;
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
async function insertCandidateData(req, res) {
  req.duplicates = [];
  let obj = req.obj;
  for (let val in obj) {
    try {
      obj[val] = await autoCompleteData(obj[val]);
      let candidate = new candidateModel(obj[val]);
      candidate = await setCreateCandidateVariables(req, candidate);
      let validateRes = await validateFields(req, candidate);
      if (validateRes) {
        obj[val].reason = req.errorMessage;
        req.duplicates.push(obj[val]);
        delete obj[val];
      }

      if (!validateRes) {
        req.candidate = await candidateModel.saveData(candidate);
        req.entityType = "candidate";
        req.activityKey = "candidateCreate";
        await activityService.insertActivity(req);
      }
    } catch (err) {
      obj[val].reason = "Error while creating Candidate" + err;
      req.duplicates.push(obj[val]);
      delete obj[val];
    }
  }
  return obj;
}

const validateFields = async (req, candidate) => {
  let isError = false;

  //replaceRequiredFields
  return isError;
};

/**@Validate bulkupload fields with csv Headers */
const validateCandidateBulkFields = async (req, res) => {
  let excelHeaders = req.headerKeys;
  let excelData = req.obj;
  req.duplicates = [];
  let bulkuploadFields = [
    "candidateName",
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
  setCreateCandidateVariables,
  setUpdateCandidateVariables,
  insertCandidateData,
  validateFields,
  validateCandidateBulkFields,
};
