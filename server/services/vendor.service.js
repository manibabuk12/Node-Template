import vendorModel from "../models/vender.model.js";

import session from "../utils/session.util";
import activityService from "./activity.service";
import i18nService from "../utils/i18n.util";
//replace_encryptedImport
//replace_serviceImport
import vendor from "../models/vender.model.js";

let _ = require("lodash");
/**
 * set Vendor variables
 * @returns {vendorModel}
 */
const setCreateVendorVariables = async (req, vendor) => {
  if (req.tokenInfo) {
    vendor.createdBy = session.getSessionLoginID(req);
    vendor.userId = session.getSessionLoginID(req);
    vendor.userName = session.getSessionLoginName(req);
    vendor.createdByName = session.getSessionLoginName(req);
    // vendor.status = "Pending";
    vendor.userEmail = session.getSessionLoginEmail(req);
    //replace_encryptedFields
    //replace_uniqueIdGeneration
  }

  vendor.created = Date.now();
  return vendor;
};

/**
 * set Vendor update variables
 * @returns {vendorModel}
 */
const setUpdateVendorVariables = async (req, vendor) => {
  if (req.tokenInfo) {
    vendor.updatedBy = session.getSessionLoginID(req);
    vendor.updatedByName = session.getSessionLoginName(req);
  }
  //replace_encryptedFields
  //replace_valideFieldsCondtion
  vendor.updated = Date.now();
  return vendor;
};

/**@RelateAutoComplete for Bulk Upload */
const autoCompleteData = async (obj) => {
  let arrObj = [
    {
      bulkUploadField: "reportingTo",
      secureApi: vendor,
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
 * insert Vendors bulk data
 * @returns {Vendors}
 */
async function insertVendorData(req, res) {
  req.duplicates = [];
  let obj = req.obj;
  for (let val in obj) {
    try {
      obj[val] = await autoCompleteData(obj[val]);
      let vendor = new vendorModel(obj[val]);
      let validateRes = await validateFields(req, obj[val]);
      if (validateRes) {
        obj[val].reason = req.errorMessage;
        req.duplicates.push(obj[val]);
        delete obj[val];
      } else {
        const uniqueEmail = await vendorModel.findUniqueEmail(vendor.email);
        if (uniqueEmail) {
          req.i18nKey = "emailExists";
          obj[val].reason = i18nService.getI18nMessage(req.i18nKey);
          req.duplicates.push(obj[val]);
          delete obj[val];
        } else {
          vendor = await setCreateVendorVariables(req, vendor);
          req.vendor = await vendorModel.saveData(vendor);
          req.entityType = "vendor";
          req.activityKey = "vendorCreate";
          await activityService.insertActivity(req);
        }
      }
    } catch (err) {
      obj[val].reason = "Error while creating Vendor" + err;
      req.duplicates.push(obj[val]);
      delete obj[val];
    }
  }
  return obj;
}

/**
 * TO get the Login cruds records
 * @returns {vendorModel}
 */
const getVendors = async (members) => {
  let reportingMembersArray = [];
  if (members && members.length > 0) {
    for (let id of members) {
      let reportingMembers = await vendorModel.find(
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

const validateFields = async (req, vendor) => {
  let isError = false;
  if (
    vendor.password &&
    !/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      vendor.password
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
const validateVendorBulkFields = async (req, res) => {
  let excelHeaders = req.headerKeys;
  let excelData = req.obj;
  req.duplicates = [];
  let bulkuploadFields = [
    "name",
    "email",
    "address",
    "role",
    "phone",
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

export default {
  setCreateVendorVariables,
  setUpdateVendorVariables,
  insertVendorData,
  getVendors,
  validateFields,
  requriedFields,
  validateVendorBulkFields,
};
