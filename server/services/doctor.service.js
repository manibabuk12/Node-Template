import doctorModel from "../models/doctor.model";

import session from "../utils/session.util";
import activityService from "./activity.service";
import i18nService from "../utils/i18n.util";
//replace_encryptedImport
//replace_serviceImport
import doctor from "../models/doctor.model";

let _ = require("lodash");
/**
 * set Doctor variables
 * @returns {doctorModel}
 */
const setCreateDoctorVariables = async (req, doctor) => {
  if (req.tokenInfo) {
    doctor.createdBy = session.getSessionLoginID(req);
    doctor.userId = session.getSessionLoginID(req);
    doctor.userName = session.getSessionLoginName(req);
    doctor.createdByName = session.getSessionLoginName(req);
    // doctor.status = "Pending";
    doctor.userEmail = session.getSessionLoginEmail(req);
    //replace_encryptedFields
    //replace_uniqueIdGeneration
  }

  doctor.created = Date.now();
  return doctor;
};

/**
 * set Doctor update variables
 * @returns {doctorModel}
 */
const setUpdateDoctorVariables = async (req, doctor) => {
  if (req.tokenInfo) {
    doctor.updatedBy = session.getSessionLoginID(req);
    doctor.updatedByName = session.getSessionLoginName(req);
  }
  //replace_encryptedFields
  //replace_valideFieldsCondtion
  doctor.updated = Date.now();
  return doctor;
};

/**@RelateAutoComplete for Bulk Upload */
const autoCompleteData = async (obj) => {
  let arrObj = [
    {
      bulkUploadField: "reportingTo",
      secureApi: doctor,
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
 * insert Doctors bulk data
 * @returns {Doctors}
 */
async function insertDoctorData(req, res) {
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
       
      let doctor = new doctorModel(obj[val]);
      let validateRes = await validateFields(req, obj[val]);
      if (validateRes) {
        obj[val].reason = req.errorMessage;
        req.duplicates.push(obj[val]);
        delete obj[val];
      } else {
        const uniqueEmail = await doctorModel.findUniqueEmail(doctor.email);
        if (uniqueEmail) {
          req.i18nKey = "emailExists";
          obj[val].reason = i18nService.getI18nMessage(req.i18nKey);
          req.duplicates.push(obj[val]);
          delete obj[val];
        } else {
          doctor = await setCreateDoctorVariables(req, doctor);
          req.doctor = await doctorModel.saveData(doctor);
          req.entityType = "doctor";
          req.activityKey = "doctorCreate";
          await activityService.insertActivity(req);
        }
      }
    } catch (err) {
      obj[val].reason = "Error while creating Doctor" + err;
      req.duplicates.push(obj[val]);
      delete obj[val];
    }
  }
  return obj;
}

/**
 * TO get the Login cruds records
 * @returns {doctorModel}
 */
const getDoctors = async (members) => {
  let reportingMembersArray = [];
  if (members && members.length > 0) {
    for (let id of members) {
      let reportingMembers = await doctorModel.find(
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

const validateFields = async (req, doctor) => {
  let isError = false;
  if (
    doctor.password &&
    !/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      doctor.password
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
const validateDoctorBulkFields = async (req, res) => {
  let excelHeaders = req.headerKeys;
  let excelData = req.obj;
  req.duplicates = [];
  let bulkuploadFields = [
    "name",
    "email",
    "password",
    "phone",
    "address",
    "role",
    "aadhar",
    "dateOFBirth",
    "gender",
    "status",
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
  setCreateDoctorVariables,
  setUpdateDoctorVariables,
  insertDoctorData,
  getDoctors,
  validateFields,
  requriedFields,
  validateDoctorBulkFields,
  setUpdateProfilePath
};
