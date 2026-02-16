import reviewModel from "../models/review.model";
import orderModel from "../models/order.model";

import session from "../utils/session.util";
import activityService from "./activity.service";
//replace_encryptedImport
//replace_serviceImport
import employee from "../models/employee.model";

let _ = require("lodash");
/**
 * set Review variables
 * @returns {reviewModel}
 */
const setCreateReviewVariables = async (req, review) => {
  if (req.tokenInfo) {
    review.createdBy = session.getSessionLoginID(req);
    // review.userId = session.getSessionLoginID(req);
    review.userName = session.getSessionLoginName(req);
    review.createdByName = session.getSessionLoginName(req);
    // review.status = "Pending";
    review.userEmail = session.getSessionLoginEmail(req);
    //replace_encryptedFields
    //replace_uniqueIdGeneration
  }

  review.created = Date.now();
  return review;
};

/**
 * set Review update variables
 * @returns {reviewModel}
 */
const setUpdateReviewVariables = async (req, review) => {
  if (req.tokenInfo) {
    review.updatedBy = session.getSessionLoginID(req);
    review.updatedByName = session.getSessionLoginName(req);
  }
  //replace_encryptedFields
  review.updated = Date.now();
  return review;
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
async function insertReviewData(req, res) {
  req.duplicates = [];
  let obj = req.obj;
  for (let val in obj) {
    try {
      obj[val] = await autoCompleteData(obj[val]);
      let review = new reviewModel(obj[val]);
      review = await setCreateReviewVariables(req, review);
      let validateRes = await validateFields(req, review);
      if (validateRes) {
        obj[val].reason = req.errorMessage;
        req.duplicates.push(obj[val]);
        delete obj[val];
      }

      if (!validateRes) {
        req.review = await reviewModel.saveData(review);
        req.entityType = "review";
        req.activityKey = "reviewCreate";
        await activityService.insertActivity(req);
      }
    } catch (err) {
      obj[val].reason = "Error while creating Review" + err;
      req.duplicates.push(obj[val]);
      delete obj[val];
    }
  }
  return obj;
}

const validateFields = async (req, review) => {
  let isError = false;

  //replaceRequiredFields
  return isError;
};

/**@Validate bulkupload fields with csv Headers */
const validateReviewBulkFields = async (req, res) => {
  let excelHeaders = req.headerKeys;
  let excelData = req.obj;
  req.duplicates = [];
  let bulkuploadFields = [
    "reviewName",
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

async function reviewValidations(req, vote) {
let isError = true;
let review = await reviewModel.findOne({active : true, productId:req.body.productId, userId:req.body.userId})
let order = await orderModel.findOne({active : true, userId:req.body.userId,"products.productId" : req.body.productId, status: "Delivered"})


if(review){
req.i18nKey = "multipleReviewErr";
return isError
}
if (order) {
req.i18nKey = "sameProductReviewErr";
return isError
}
 
}

export default {
  setCreateReviewVariables,
  setUpdateReviewVariables,
  insertReviewData,
  validateFields,
  validateReviewBulkFields,
  reviewValidations
};
