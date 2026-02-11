import prescriptionModel from "../models/prescription.model";

import session from "../utils/session.util";
import activityService from "./activity.service";
//replace_encryptedImport
//replace_serviceImport
import employee from "../models/employee.model";

let _ = require("lodash");
/**
 * set Prescription variables
 * @returns {prescriptionModel}
 */
const setCreatePrescriptionVariables = async (req, prescription) => {
  if (req.tokenInfo) {
    prescription.createdBy = session.getSessionLoginID(req);
    prescription.userId = session.getSessionLoginID(req);
    prescription.userName = session.getSessionLoginName(req);
    prescription.createdByName = session.getSessionLoginName(req);
    // prescription.status = "Pending";
    prescription.userEmail = session.getSessionLoginEmail(req);
    //replace_encryptedFields
    //replace_uniqueIdGeneration
  }

  prescription.created = Date.now();
  return prescription;
};

/**
 * set Prescription update variables
 * @returns {prescriptionModel}
 */
const setUpdatePrescriptionVariables = async (req, prescription) => {
  if (req.tokenInfo) {
    prescription.updatedBy = session.getSessionLoginID(req);
    prescription.updatedByName = session.getSessionLoginName(req);
  }
  //replace_encryptedFields
  prescription.updated = Date.now();
  return prescription;
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
async function insertPrescriptionData(req, res) {
  req.duplicates = [];
  let obj = req.obj;
  for (let val in obj) {
    try {
      obj[val] = await autoCompleteData(obj[val]);
      let prescription = new prescriptionModel(obj[val]);
      prescription = await setCreatePrescriptionVariables(req, prescription);
      let validateRes = await validateFields(req, prescription);
      if (validateRes) {
        obj[val].reason = req.errorMessage;
        req.duplicates.push(obj[val]);
        delete obj[val];
      }

      if (!validateRes) {
        req.prescription = await prescriptionModel.saveData(prescription);
        req.entityType = "prescription";
        req.activityKey = "prescriptionCreate";
        await activityService.insertActivity(req);
      }
    } catch (err) {
      obj[val].reason = "Error while creating Prescription" + err;
      req.duplicates.push(obj[val]);
      delete obj[val];
    }
  }
  return obj;
}

const validateFields = async (req, prescription) => {
  let isError = false;

  //replaceRequiredFields
  return isError;
};

/**@Validate bulkupload fields with csv Headers */
const validatePrescriptionBulkFields = async (req, res) => {
  let excelHeaders = req.headerKeys;
  let excelData = req.obj;
  req.duplicates = [];
  let bulkuploadFields = [
    "prescriptionName",
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
  setCreatePrescriptionVariables,
  setUpdatePrescriptionVariables,
  insertPrescriptionData,
  validateFields,
  validatePrescriptionBulkFields,
};
