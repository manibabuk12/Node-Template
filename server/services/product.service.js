import productModel from "../models/product.model";

import session from "../utils/session.util";
import activityService from "./activity.service";
//replace_encryptedImport
//replace_serviceImport
import employee from "../models/employee.model";
import Counter from "../models/counter.model"

let _ = require("lodash");
/**
 * set Product variables
 * @returns {productModel}
 */
const setCreateProductVariables = async (req, product) => {


//  Auto-Increment ProductId
const lastRecord = await productModel.findOne().sort({ created: -1 });
 
let nextProductNum = "1";
if (lastRecord && lastRecord.productId) {
// Extracts the number
const lastNum = parseInt(lastRecord.productId.replace(/^\D+/g, ''), 10);
nextProductNum = isNaN(lastNum) ? 0 : lastNum + 1;
}
product.productId = `P-${nextProductNum}`;



  if (req.tokenInfo) {
    product.createdBy = session.getSessionLoginID(req);
    product.userId = session.getSessionLoginID(req);
    product.userName = session.getSessionLoginName(req);
    product.createdByName = session.getSessionLoginName(req);
    // product.status = "Pending";
    product.userEmail = session.getSessionLoginEmail(req);
    //replace_encryptedFields
    //replace_uniqueIdGeneration
  }

  product.created = Date.now();
  return product;
};

/**
 * set Product update variables
 * @returns {productModel}
 */
const setUpdateProductVariables = async (req, product) => {
  if (req.tokenInfo) {
    product.updatedBy = session.getSessionLoginID(req);
    product.updatedByName = session.getSessionLoginName(req);
  }
  //replace_encryptedFields
  product.updated = Date.now();
  return product;
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
async function insertProductData(req, res) {
  req.duplicates = [];
  let obj = req.obj;
  for (let val in obj) {
    try {
      obj[val] = await autoCompleteData(obj[val]);
      let product = new productModel(obj[val]);
      product = await setCreateProductVariables(req, product);
      let validateRes = await validateFields(req, product);
      if (validateRes) {
        obj[val].reason = req.errorMessage;
        req.duplicates.push(obj[val]);
        delete obj[val];
      }

      if (!validateRes) {
        req.product = await productModel.saveData(product);
        req.entityType = "product";
        req.activityKey = "productCreate";
        await activityService.insertActivity(req);
      }
    } catch (err) {
      obj[val].reason = "Error while creating Product" + err;
      req.duplicates.push(obj[val]);
      delete obj[val];
    }
  }
  return obj;
}

const validateFields = async (req, product) => {
  let isError = false;

  //replaceRequiredFields
  return isError;
};

/**@Validate bulkupload fields with csv Headers */
const validateProductBulkFields = async (req, res) => {
  let excelHeaders = req.headerKeys;
  let excelData = req.obj;
  req.duplicates = [];
  let bulkuploadFields = [
    "productName",
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
  setCreateProductVariables,
  setUpdateProductVariables,
  insertProductData,
  validateFields,
  validateProductBulkFields,
};
