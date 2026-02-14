import orderModel from "../models/order.model";
import Counter from "../models/counter.model.js"
import session from "../utils/session.util";
import activityService from "./activity.service";
import Product from "../models/product.model.js"
//replace_encryptedImport
//replace_serviceImport
import employee from "../models/employee.model";

let _ = require("lodash");
/**
 * set Order variables
 * @returns {orderModel}
 */


 const setCreateOrderVariables = async (req, order) => {
//   const orderCounter = await Counter.findOneAndUpdate(
//     {id:"orderCounter"},
//     { $inc : {seq: 1}},
//     { new: true,upsert:true}
//   )
//   order.orderId = "O-" + String(orderCounter.seq).padStart(6,0)
// 2. Auto-Increment ProductId
  const lastRecord = await orderModel.findOne().sort({ created: -1 });
   
  let nextOrderNum = "1";
  let nextInvoiceNum = "1";
  if (lastRecord && lastRecord.orderId && lastRecord.invoiceNumber) {
  // Extracts the number
  const lastNum = parseInt(lastRecord.orderId.replace(/^\D+/g, ''), 10);
  const lastInvoice = parseInt(lastRecord.invoiceNumber.replace(/^\D+/g, ''), 10);
  nextOrderNum = isNaN(lastNum) ? 0 : lastNum + 1;
  nextInvoiceNum = isNaN(lastInvoice) ? 0 : lastInvoice + 1;
  }
  order.orderId = `O-${nextOrderNum}`;
  
  
  const today = new Date();
  const dd = String(today.getDate()).padStart(2,0)
  const mm = String(today.getMonth() + 1).padStart(2,0);
  const yyyy = today.getFullYear()

  const date = `${dd}${mm}${yyyy}`


  order.invoiceNumber = `INV-${date}-${nextInvoiceNum}`

  // calculating total quantity and total price dynamically
  const products = req.body.products || order.products || [];
  let totalQuantity = 0;
  let totalPrice = 0;

  for (let item of products) {
    const quantity = Number(item.quantity || 0)
    const product = await Product.findOne({productId:item.productId})
    const price = product? Number(product.price || 0): 0

    totalQuantity += quantity
    totalPrice += quantity * price
  }
  order.totalQuantity = totalQuantity
  order.totalPrice = totalPrice
  order.products = products

  if (req.tokenInfo) {
    order.createdBy = session.getSessionLoginID(req);
    // order.userId = session.getSessionLoginID(req);
    order.userName = session.getSessionLoginName(req);
    order.createdByName = session.getSessionLoginName(req);
    // order.status = "Pending";
    order.userEmail = session.getSessionLoginEmail(req);
    //replace_encryptedFields
    //replace_uniqueIdGeneration
  }

  order.created = Date.now();
  return order;
};

/**
 * set Order update variables
 * @returns {orderModel}
 */
const setUpdateOrderVariables = async (req, order) => {

  // if (req.body.isOrderDelivered === true && order.isOrderDelivered !== false) {
  //   order.isOrderDelivered = true,
  //   order.deliveryDate = new Date()
  //   order.status = "Delivered"
  // }

  if (req.tokenInfo) {
    order.updatedBy = session.getSessionLoginID(req);
    order.updatedByName = session.getSessionLoginName(req);
  }
  //replace_encryptedFields
  order.updated = Date.now();
  if(order.status === "Delivered"){
    order.isOrderDelivered = Date.now();
  }
  return order;
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
async function insertOrderData(req, res) {
  req.duplicates = [];
  let obj = req.obj;
  for (let val in obj) {
    try {
      obj[val] = await autoCompleteData(obj[val]);
      let order = new orderModel(obj[val]);
      order = await setCreateOrderVariables(req, order);
      let validateRes = await validateFields(req, order);
      if (validateRes) {
        obj[val].reason = req.errorMessage;
        req.duplicates.push(obj[val]);
        delete obj[val];
      }

      if (!validateRes) {
        req.order = await orderModel.saveData(order);
        req.entityType = "order";
        req.activityKey = "orderCreate";
        await activityService.insertActivity(req);
      }
    } catch (err) {
      obj[val].reason = "Error while creating Order" + err;
      req.duplicates.push(obj[val]);
      delete obj[val];
    }
  }
  return obj;
}

const validateFields = async (req, order) => {
  let isError = false;

  //replaceRequiredFields
  return isError;
};

/**@Validate bulkupload fields with csv Headers */
const validateOrderBulkFields = async (req, res) => {
  let excelHeaders = req.headerKeys;
  let excelData = req.obj;
  req.duplicates = [];
  let bulkuploadFields = [
    "orderName",
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
  setCreateOrderVariables,
  setUpdateOrderVariables,
  insertOrderData,
  validateFields,
  validateOrderBulkFields,
};