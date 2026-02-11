import patientModel from "../models/patient.model";

import session from "../utils/session.util";
import activityService from "./activity.service";
import i18nService from "../utils/i18n.util";
//replace_encryptedImport
//replace_serviceImport
import patient from "../models/patient.model.js";

let _ = require("lodash");
/**
 * set Patient variables
 * @returns {patientModel}
 */
const setCreatePatientVariables = async (req, patient) => {
  if (req.tokenInfo) {
    patient.createdBy = session.getSessionLoginID(req);
    patient.userId = session.getSessionLoginID(req);
    patient.userName = session.getSessionLoginName(req);
    patient.createdByName = session.getSessionLoginName(req);
    // patient.status = "Pending";
    patient.userEmail = session.getSessionLoginEmail(req);
    //replace_encryptedFields
    //replace_uniqueIdGeneration
  }

  console.log("come from patientService============ ",patient.doctorId);
  patient.created = Date.now();
  return patient;
};

/**
 * set Patient update variables
 * @returns {patientModel}
 */
const setUpdatePatientVariables = async (req, patient) => {
  if (req.tokenInfo) {
    patient.updatedBy = session.getSessionLoginID(req);
    patient.updatedByName = session.getSessionLoginName(req);
  }
  //replace_encryptedFields
  //replace_valideFieldsCondtion
  patient.updated = Date.now();
  return patient;
};

/**@RelateAutoComplete for Bulk Upload */
const autoCompleteData = async (obj) => {
  let arrObj = [
    {
      bulkUploadField: "reportingTo",
      secureApi: patient,
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
 * insert Patients bulk data
 * @returns {Patients}
 */
async function insertPatientData(req, res) {
  req.duplicates = [];
  let obj = req.obj;
  for (let val in obj) {
    try {
      obj[val] = await autoCompleteData(obj[val]);

      if (obj[val]) {
       const dateFields = ["joinDate", "dateOFBirth", "orientationDate", "terminationDate"];
      for (let dateField of dateFields) {
        if (obj[val][dateField] && obj[val][dateField] !== "null") {
      obj[val][dateField] = await serviceUtil.convertToUTCMidnight(obj[val][dateField]);
       }
       }}

      let patient = new patientModel(obj[val]);
      let validateRes = await validateFields(req, obj[val]);
      if (validateRes) {
        obj[val].reason = req.errorMessage;
        req.duplicates.push(obj[val]);
        delete obj[val];
      } else {
        const uniqueEmail = await patientModel.findUniqueEmail(patient.email);
        if (uniqueEmail) {
          req.i18nKey = "emailExists";
          obj[val].reason = i18nService.getI18nMessage(req.i18nKey);
          req.duplicates.push(obj[val]);
          delete obj[val];
        } else {
          patient = await setCreatePatientVariables(req, patient);
          req.patient = await patientModel.saveData(patient);
          req.entityType = "patient";
          req.activityKey = "patientCreate";
          await activityService.insertActivity(req);
        }
      }
    } catch (err) {
      obj[val].reason = "Error while creating Patient" + err;
      req.duplicates.push(obj[val]);
      delete obj[val];
    }
  }
  return obj;
}

/**
 * TO get the Login cruds records
 * @returns {patientModel}
 */
const getPatients = async (members) => {
  let reportingMembersArray = [];
  if (members && members.length > 0) {
    for (let id of members) {
      let reportingMembers = await patientModel.find(
        { reportingTo: id },
        { _id: 1 }
      );
      if (reportingMembers && reportingMembers.length > 0) {
        for (let obj of reportingMembers) {
          reportingMembersArray.push(obj._id);
        }
      }
    }
  }

  return reportingMembersArray;
};

const validateFields = async (req, patient) => {
  let isError = false;
  if (
    patient.password &&
    !/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      patient.password
    )
  ) {
    req.errorMessage =
      "Password must contain at least 8 characters, one uppercase, one number and one special case character";
    isError = true;
    return isError;
  }
  //replaceRequiredFields
  return isError;
};

const requriedFields = async (req) => {
  let isError = false;
  /**@email required */
  if (
    (req && req.body && req.body.email && req.body.email.trim() == "") ||
    (req && req.body && !req.body.email)
  ) {
    isError = true;
  }
  /**@Password required */
  if (
    (req && req.body && req.body.password && req.body.password.trim() == "") ||
    (req && req.body && !req.body.password)
  ) {
    isError = true;
  }
  return isError;
};

/**@Validate bulkupload fields with csv Headers */
const validatePatientBulkFields = async (req, res) => {
  let excelHeaders = req.headerKeys;
  let excelData = req.obj;
  req.duplicates = [];
  let bulkuploadFields = [
    "name",
    "email",
    "password",
    "age",
    "height",
    "weight",
    "address",
    "role",
    "phone",
    "aadhar",
    "dateOfBirth",
    "gender",
    "status",
    "doctorsIds",
    "reportsIds",
    "prescriptionsIds"
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

const setUpdateProfilePath = async(req,res)=>{
  await doctorModel.updateOne({_id:req.tokenInfo._id,active:true},{$set:{profile:req.uploadFile[0].name}})
}

export default {
  setCreatePatientVariables,
  setUpdatePatientVariables,
  insertPatientData,
  getPatients,
  validateFields,
  requriedFields,
  validatePatientBulkFields,
  setUpdateProfilePath
};
