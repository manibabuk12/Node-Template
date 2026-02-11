import hospitalModel from "../models/hospital.model";

import session from "../utils/session.util";
import activityService from "./activity.service";
//replace_encryptedImport
//replace_serviceImport
import employee from "../models/employee.model";

let _ = require("lodash");
/**
 * set Hospital variables
 * @returns {hospitalModel}
 */
const setCreateHospitalVariables = async (req, hospital) => {
  if (req.tokenInfo) {
    hospital.createdBy = session.getSessionLoginID(req);
    hospital.userId = session.getSessionLoginID(req);
    hospital.userName = session.getSessionLoginName(req);
    hospital.createdByName = session.getSessionLoginName(req);
    // hospital.status = "Pending";
    hospital.userEmail = session.getSessionLoginEmail(req);
    //replace_encryptedFields
    //replace_uniqueIdGeneration
  }

  hospital.created = Date.now();
  return hospital;
};

/**
 * set Hospital update variables
 * @returns {hospitalModel}
 */
const setUpdateHospitalVariables = async (req, hospital) => {
  if (req.tokenInfo) {
    hospital.updatedBy = session.getSessionLoginID(req);
    hospital.updatedByName = session.getSessionLoginName(req);
  }
  //replace_encryptedFields
  hospital.updated = Date.now();
  return hospital;
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
async function insertHospitalData(req, res) {
  req.duplicates = [];
  let obj = req.obj;
  for (let val in obj) {
    try {
      obj[val] = await autoCompleteData(obj[val]);
      let hospital = new hospitalModel(obj[val]);
      hospital = await setCreateHospitalVariables(req, hospital);
      let validateRes = await validateFields(req, hospital);
      if (validateRes) {
        obj[val].reason = req.errorMessage;
        req.duplicates.push(obj[val]);
        delete obj[val];
      }

      if (!validateRes) {
        req.hospital = await hospitalModel.saveData(hospital);
        req.entityType = "hospital";
        req.activityKey = "hospitalCreate";
        await activityService.insertActivity(req);
      }
    } catch (err) {
      obj[val].reason = "Error while creating Hospital" + err;
      req.duplicates.push(obj[val]);
      delete obj[val];
    }
  }
  return obj;
}

const validateFields = async (req, hospital) => {
  let isError = false;

  //replaceRequiredFields
  return isError;
};

/**@Validate bulkupload fields with csv Headers */
const validateHospitalBulkFields = async (req, res) => {
  let excelHeaders = req.headerKeys;
  let excelData = req.obj;
  req.duplicates = [];
  let bulkuploadFields = [
    "hospitalName",
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
  setCreateHospitalVariables,
  setUpdateHospitalVariables,
  insertHospitalData,
  validateFields,
  validateHospitalBulkFields,
};
