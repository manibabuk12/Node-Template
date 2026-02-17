import vendorModel from "../models/vendor.model.js";

import session from "../utils/session.util.js";
import activityService from "./activity.service.js";
import i18nService from "../utils/i18n.util.js";
//replace_encryptedImport
//replace_serviceImport
import vendor from "../models/vendor.model.js";
import serviceUtil from "../utils/service.util.js";
import orderModel from "../models/order.model.js";
import reviewModel from "../models/review.model.js";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import Review from "../models/review.model.js";

let _ = require("lodash");
/**
 * set Vendor variables
 * @returns {vendorModel}
 */
const setCreateVendorVariables = async (req, vendor) => {

    const lastRecord = await vendorModel.findOne().sort({ created: -1 });
    
    let nextVendorNum = "1";
    if (lastRecord && lastRecord.productId) {
    // Extracts the number
    const lastNum = parseInt(lastRecord.vendorId.replace(/^\D+/g, ''), 10);
    nextVendorNum = isNaN(lastNum) ? 0 : lastNum + 1;
    }
    vendor.vendorId = `V-${nextVendorNum}`;


  if (req.tokenInfo) {
    vendor.createdBy = session.getSessionLoginID(req);
    vendor.vendorId = session.getSessionLoginID(req);
    vendor.vendorName = session.getSessionLoginName(req);
    vendor.createdByName = session.getSessionLoginName(req);
    // vendor.status = "Pending";
    vendor.vendorEmail = session.getSessionLoginEmail(req);
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
      if (obj[val]) {
 const dateFields = ["joinDate", "dateOFBirth", "orientationDate", "terminationDate"];
for (let dateField of dateFields) {
  if (obj[val][dateField] && obj[val][dateField] !== "null") {
obj[val][dateField] = await serviceUtil.convertToUTCMidnight(obj[val][dateField]);
 }
 }}
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

const validateFields = async (req, vendors) => {
let isError = false;
  if (
  vendors.password &&
  !/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
  vendors.password
  )) {
  req.errorMessage =
  "Password must contain at least 8 characters, one uppercase, one number and one special case character";
  isError = true;
  return isError;
  }
  //only his record
  if(req.tokenInfo.role === "vendor") {
  if(vendors._id && vendors._id.toString() !== req.tokenInfo._id){
  req.i18nKey = "ownUpdatePermissionErr";
  isError = true;
}
}

  //only his record
  if(req.tokenInfo.role === "vendor") {
  if(vendors._id && vendors._id.toString() !== req.tokenInfo._id){
    req.i18nKey = "ownUpdatePermissionErr";
    isError = true;
}
}

  // allow only specific fields
  const allowedFields = ["firstName", "lastName", "phoneNumber"];
  const updateKeys = Object.keys(req.body);
  const invalidField = updateKeys.find(
  key => !allowedFields.includes(key)
);
if(invalidField){
  req.i18nKey = "updateLimitErr";
  isError = true;
}
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

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @return update the vendor profile path
 */
const setUpdateProfilePath = async(req,res)=>{
  await vendorModel.updateOne({_id:req.tokenInfo._id,active:true},{$set:{profile:req.uploadFile[0].name}})
}

const roleBasedOrdersProductsReviews = async (req) => {

  //  Get logged-in vendor
  const vendor = await vendorModel
    .findById(req.tokenInfo._id)
    .lean();

  if (!vendor) {
    throw new Error("Vendor not found");
  }

  const vendorId = vendor.vendorId;

  //  Get orders & reviews of that vendor
  const orders = await orderModel
    .find({ vendorId })
    .lean();

  const reviews = await reviewModel
    .find({ vendorId })
    .lean();

  // Create review map (productId → reviews[])
  const reviewMap = {};

  for (const review of reviews) {
    if (!reviewMap[review.productId]) {
      reviewMap[review.productId] = [];
    }
    reviewMap[review.productId].push(review);
  }

  // Combine orders with related reviews
  const combined = orders.map(order => {

    // Flatten nested product arrays
    const flatProducts = order.products.flat();

    // Extract productIds
    const productIds = flatProducts.map(p => p.productId);

    // Get matching reviews
    const matchedReviews = productIds.flatMap(
      id => reviewMap[id] || []
    );

    return {
      ...order,
      reviews: matchedReviews
    };
  });

  return combined;
};


export const getVendorDashboardService = async (vendorId) => {

  //  Get vendor products
  const products = await Product.find({ vendorId }).lean();
  const productIds = products.map(p => p.productId);

  if (!productIds.length) {
    return {
      totalOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0,
      monthWiseOrders: {},
      weekWiseOrders: {},
      bestSellingProducts: [],
      averageRating: 0
    };
  }

  const productIdSet = new Set(productIds);


  //  Get orders containing vendor products

  const orders = await Order.find({active :true }).lean();
  let myOrders = []
  for(let order of orders){
    let products = order.products 
    let currentProductIds = products.map((product)=>{return product.productId})
    let result = currentProductIds.find(id=>productIds.includes(id))
    if(result){
      myOrders.push(order)
    }
  } 

  let totalOrders = orders.length;
  let deliveredOrders = 0;
  let cancelledOrders = 0;
  let processingOrder = 0;
  let totalRevenue = 0;

  const monthWiseOrders = {};
  const weekWiseOrders = {};
  const productSales = {};

  for (const order of orders) {

    if(order.status === "Delivered"){
      deliveredOrders++;
    }else if(order.status === "Cancelled"){
      cancelledOrders++;
    }else{
      processingOrder++;
    }

    totalRevenue += order.totalPrice;

    if(order.deliveryDate){
      const date = new Date(order.deliveryDate);

      const month = date.toLocaleString("default",{month:"short"});
      monthWiseOrders[month] = (monthWiseOrders[month]||0)+1;

      const weekNumber = Math.ceil(date.getDate()/7);
      const weekKey = `Week ${weekNumber}`;
      weekWiseOrders[weekKey] = (weekWiseOrders[weekKey] || 0)+1;
    }

    for(const product of order.products){
      if(productIdSet.has(product.productId)){
        productSales[product.productId] = (productSales[product.productId] || 0)+product.quantity;
      }
    }

  }

  // Best Selling Products (sorted)
  const bestSellingProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .map(([productId, quantity]) => ({
      productId,
      quantity
    }));

  //  Average Rating
  const reviews = await Review.find({
    productId: { $in: productIds },
    status: "Active"
  }).lean();

  let averageRating = 0;

  if (reviews.length) {
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    averageRating = Number((totalRating / reviews.length).toFixed(2));
  }

  return {
    totalOrders,
    deliveredOrders,
    cancelledOrders,
    totalRevenue,
    processingOrder,
    monthWiseOrders,
    weekWiseOrders,
    bestSellingProducts,
    averageRating
  };
};


/**
* VENDOR DASHBOARD (Aggregation only)
*/
// async function vendorDashboardAgg(vendorObjectId) {
// const vendorId = new mongoose.Types.ObjectId(vendorObjectId)
// const monthWiseOrders = await Order.aggregate([
// { $match: { active: true, createdBy: vendorId } },
// {
// $group: {
// _id: { $month: "$created" },
// totalOrders: { $sum: 1 }
// }
// },
// { $sort: { _id: 1 } }
// ]);
 
// const weekWiseOrders = await Order.aggregate([
// { $match: { active: true, createdBy: vendorId } },
// {
// $group: {
// _id: { $week: "$created" },
// totalOrders: { $sum: 1 }
// }
// },
// { $sort: { _id: 1 } }
// ]);
 
// const bestSellingProducts = await Order.aggregate([
// { $match: { active: true, createdBy: vendorId } },
// { $unwind: "$products" },
// { $unwind: "$products" },
// {
// $group: {
// _id: "$products.productId",
// productName: { $first: "$products.productName" },
// totalSold: { $sum: "$products.quantity" }
// }
// },
// { $sort: { totalSold: -1 } }
// ]);
 
// const orderStats = await Order.aggregate([
// { $match: { createdBy: vendorId } },
// {
// $group: {
// _id: null,
// totalOrders: { $sum: 1 },
// deliveredOrders: {
// $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] }
// },
// cancelledOrders: {
// $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] }
// },
// totalAmount: { $sum: "$totalPrice" }
// }
// }
// ]);
 
// const avgRating = await Review.aggregate([
// {
// $group: {
// _id: null,
// avgRating: { $avg: "$rating" }
// }
// }
// ]);
 
// return {
// monthWiseOrders,
// weekWiseOrders,
// bestSellingProducts,
// totalOrders: orderStats.length ? orderStats[0].totalOrders : 0,
// deliveredOrders: orderStats.length ? orderStats[0].deliveredOrders : 0,
// cancelledOrders: orderStats.length ? orderStats[0].cancelledOrders : 0,
// totalAmount: orderStats.length ? orderStats[0].totalAmount : 0,
// avgRating: avgRating.length ? avgRating[0].avgRating : 0
// };
// }
export default {
  setCreateVendorVariables,
  setUpdateVendorVariables,
  insertVendorData,
  getVendors,
  validateFields,
  requriedFields,
  validateVendorBulkFields,
  setUpdateProfilePath,
  roleBasedOrdersProductsReviews,
  getVendorDashboardService
};
