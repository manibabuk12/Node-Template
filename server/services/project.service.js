import projectModel from "../models/project.model";

import session from "../utils/session.util";
import activityService from "./activity.service";
import i18nService from "../utils/i18n.util";
//replace_encryptedImport
//replace_serviceImport
import employee from "../models/employee.model";

let _ = require("lodash");
/**
 * set Project variables
 * @returns {projectModel}
 */
const setCreateProjectVariables = async (req, project) => {
  if (req.tokenInfo) {
    project.createdBy = session.getSessionLoginID(req);
    project.userId = session.getSessionLoginID(req);
    project.userName = session.getSessionLoginName(req);
    project.createdByName = session.getSessionLoginName(req);
    // project.status = "Pending";
    project.userEmail = session.getSessionLoginEmail(req);
    //replace_encryptedFields
    //replace_uniqueIdGeneration
  }

  project.created = Date.now();
  return project;
};

/**
 * set Project update variables
 * @returns {projectModel}
 */
const setUpdateProjectVariables = async (req, project) => {
  if (req.tokenInfo) {
    project.updatedBy = session.getSessionLoginID(req);
    project.updatedByName = session.getSessionLoginName(req);
  }
  //replace_encryptedFields
  //replace_valideFieldsCondtion
  project.updated = Date.now();
  return project;
};

/**@RelateAutoComplete for Bulk Upload */
const autoCompleteData = async (obj) => {
  let arrObj = [
    {
      bulkUploadField: "team_Lead",
      secureApi: employee,
      searchField: "name",
      isMultiple: undefined,
    },
    {
      bulkUploadField: "teamMembers",
      secureApi: employee,
      searchField: "name",
      isMultiple: true,
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
async function insertProjectData(req, res) {
  req.duplicates = [];
  let obj = req.obj;
  for (let val in obj) {
    try {
      obj[val] = await autoCompleteData(obj[val]);
      let project = new projectModel(obj[val]);
      let validateRes = await validateFields(req, obj[val]);
      if (validateRes) {
        obj[val].reason = req.errorMessage;
        req.duplicates.push(obj[val]);
        delete obj[val];
      } else {
        const uniqueEmail = await projectModel.findUniqueEmail(project.email);
        if (uniqueEmail) {
          req.i18nKey = "emailExists";
          obj[val].reason = i18nService.getI18nMessage(req.i18nKey);
          req.duplicates.push(obj[val]);
          delete obj[val];
        } else {
          project = await setCreateProjectVariables(req, project);
          req.project = await projectModel.saveData(project);
          req.entityType = "project";
          req.activityKey = "projectCreate";
          await activityService.insertActivity(req);
        }
      }
    } catch (err) {
      obj[val].reason = "Error while creating Project" + err;
      req.duplicates.push(obj[val]);
      delete obj[val];
    }
  }
  return obj;
}

/**
 * TO get the Login cruds records
 * @returns {projectModel}
 */
const getEmployees = async (members) => {
  let reportingMembersArray = [];
  if (members && members.length > 0) {
    for (let id of members) {
      let reportingMembers = await projectModel.find(
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

const validateFields = async (req, project) => {
  let isError = false;
  if (
    project.password &&
    !/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      project.password
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
const validateProjectBulkFields = async (req, res) => {
  let excelHeaders = req.headerKeys;
  let excelData = req.obj;
  req.duplicates = [];
  let bulkuploadFields = ["name", "startDate", "endDate", "teamSize"];
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
  setCreateProjectVariables,
  setUpdateProjectVariables,
  insertProjectData,
  getEmployees,
  validateFields,
  requriedFields,
  validateProjectBulkFields,
};
