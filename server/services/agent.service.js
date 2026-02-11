import agentModel from "../models/agent.model";

import session from "../utils/session.util";
import activityService from "./activity.service";
import i18nService from "../utils/i18n.util";
import serviceUtil from "../utils/service.util";
//replace_encryptedImport
//replace_serviceImport
import agent from "../models/agent.model";

let _ = require("lodash");
/**
 * set Agent variables
 * @returns {agentModel}
 */
const setCreateAgentVariables = async (req, agent) => {
  if (req.tokenInfo) {
    agent.createdBy = session.getSessionLoginID(req);
    agent.userId = session.getSessionLoginID(req);
    agent.userName = session.getSessionLoginName(req);
    agent.createdByName = session.getSessionLoginName(req);
    // agent.status = "Pending";
    agent.userEmail = session.getSessionLoginEmail(req);
    //replace_encryptedFields
    //replace_uniqueIdGeneration
  }

  agent.created = Date.now();
  return agent;
};

/**
 * set Agent update variables
 * @returns {agentModel}
 */
const setUpdateAgentVariables = async (req, agent) => {
  if (req.tokenInfo) {
    agent.updatedBy = session.getSessionLoginID(req);
    agent.updatedByName = session.getSessionLoginName(req);
  }
  //replace_encryptedFields
  //replace_valideFieldsCondtion
  agent.updated = Date.now();
  return agent;
};

/**@RelateAutoComplete for Bulk Upload */
const autoCompleteData = async (obj) => {
  let arrObj = [
    {
      bulkUploadField: "reportingTo",
      secureApi: agent,
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
 * insert Agents bulk data
 * @returns {Agents}
 */
async function insertAgentData(req, res) {
  req.duplicates = [];
  let obj = req.obj;
  for (let val in obj) {
    try {
      obj[val] = await autoCompleteData(obj[val]);
      if (obj[val]) {
        const dateFields = ["joinDate", "dateOfBirth", "orientationDate", "terminationDate"];
        for (let dateField of dateFields) {
          if (obj[val][dateField] && obj[val][dateField] !== "null") {
            obj[val][dateField] = await serviceUtil.convertToUTCMidnight(obj[val][dateField]);
          }
        }
      }
      let agent = new agentModel(obj[val]);
      let validateRes = await validateFields(req, obj[val]);
      if (validateRes) {
        obj[val].reason = req.errorMessage;
        req.duplicates.push(obj[val]);
        delete obj[val];
      } else {
        const uniqueEmail = await agentModel.findUniqueEmail(agent.email);
        if (uniqueEmail) {
          req.i18nKey = "emailExists";
          obj[val].reason = i18nService.getI18nMessage(req.i18nKey);
          req.duplicates.push(obj[val]);
          delete obj[val];
        } else {
          agent = await setCreateAgentVariables(req, agent);
          req.agent = await agentModel.saveData(agent);
          req.entityType = "agent";
          req.activityKey = "agentCreate";
          await activityService.insertActivity(req);
        }
      }
    } catch (err) {
      obj[val].reason = "Error while creating Agent" + err;
      req.duplicates.push(obj[val]);
      delete obj[val];
    }
  }
  return obj;
}

/**
 * TO get the Login cruds records
 * @returns {agentModel}
 */
const getAgents = async (members) => {
  let reportingMembersArray = [];
  if (members && members.length > 0) {
    for (let id of members) {
      let reportingMembers = await agentModel.find(
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

const validateFields = async (req, agent) => {
  let isError = false;
  if (
    agent.password &&
    !/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      agent.password
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
const validateAgentBulkFields = async (req, res) => {
  let excelHeaders = req.headerKeys;
  let excelData = req.obj;
  req.duplicates = [];
  let bulkuploadFields = [
    "name",
    "email",
    "role",
    "phone",
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
await agentModel.updateOne({_id:req.tokenInfo._id,active:true},{$set:{profile:req.uploadFile[0].name}})
}



export default {
  setCreateAgentVariables,
  setUpdateAgentVariables,
  insertAgentData,
  getAgents,
  validateFields,
  requriedFields,
  validateAgentBulkFields,
  setUpdateProfilePath
};
