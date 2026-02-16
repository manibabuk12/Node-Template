import userModel from "../models/user.model";

import session from "../utils/session.util";
import activityService from "./activity.service";
import i18nService from "../utils/i18n.util";
//replace_encryptedImport
//replace_serviceImport
import user from "../models/user.model";
import serviceUtil from "../utils/service.util";
import Counter from "../models/counter.model.js";
import orderModel from "../models/order.model.js";
import reviewModel from "../models/review.model.js";

let _ = require("lodash");
/**
 * set User variables
 * @returns {userModel}
 */
const setCreateUserVariables = async (req, user) => {

  const count = await Counter.findOneAndUpdate(
    {id:"userId"},
    {$inc:{seq:1}},
    {new :true, upsert:true}
  )
  user.userId = "U-"+String(count.seq).padStart(4,0);
  if (req.tokenInfo) {
    user.createdBy = session.getSessionLoginID(req);
    user.userId = session.getSessionLoginID(req);
    user.userName = session.getSessionLoginName(req);
    user.createdByName = session.getSessionLoginName(req);
    // user.status = "Pending";
    user.userEmail = session.getSessionLoginEmail(req);
    //replace_encryptedFields
    //replace_uniqueIdGeneration
  }

  user.created = Date.now();
  return user;
};

/**
 * set User update variables
 * @returns {userModel}
 */
const setUpdateUserVariables = async (req, user) => {
  if (req.tokenInfo) {
    user.updatedBy = session.getSessionLoginID(req);
    user.updatedByName = session.getSessionLoginName(req);
  }
  //replace_encryptedFields
  //replace_valideFieldsCondtion
  user.updated = Date.now();
  return user;
};

/**@RelateAutoComplete for Bulk Upload */
const autoCompleteData = async (obj) => {
  let arrObj = [
    {
      bulkUploadField: "reportingTo",
      secureApi: user,
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
 * insert Users bulk data
 * @returns {Users}
 */
async function insertUserData(req, res) {
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
      let user = new userModel(obj[val]);
      let validateRes = await validateFields(req, obj[val]);
      if (validateRes) {
        obj[val].reason = req.errorMessage;
        req.duplicates.push(obj[val]);
        delete obj[val];
      } else {
        const uniqueEmail = await userModel.findUniqueEmail(user.email);
        if (uniqueEmail) {
          req.i18nKey = "emailExists";
          obj[val].reason = i18nService.getI18nMessage(req.i18nKey);
          req.duplicates.push(obj[val]);
          delete obj[val];
        } else {
          user = await setCreateUserVariables(req, user);
          req.user = await userModel.saveData(user);
          req.entityType = "user";
          req.activityKey = "userCreate";
          await activityService.insertActivity(req);
        }
      }
    } catch (err) {
      obj[val].reason = "Error while creating User" + err;
      req.duplicates.push(obj[val]);
      delete obj[val];
    }
  }
  return obj;
}

/**
 * TO get the Login cruds records
 * @returns {userModel}
 */
const getUsers = async (members) => {
  let reportingMembersArray = [];
  if (members && members.length > 0) {
    for (let id of members) {
      let reportingMembers = await userModel.find(
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

const validateFields = async (req, users) => {
let isError = false;
  if (
  users.password &&
  !/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
  users.password
  )) {
  req.errorMessage =
  "Password must contain at least 8 characters, one uppercase, one number and one special case character";
  isError = true;
  return isError;
  }
  //only his record
  if(req.tokenInfo.role === "user") {
  if(users._id && users._id.toString() !== req.tokenInfo._id){
  req.i18nKey = "ownUpdatePermissionErr";
  isError = true;
}
}

  //only his record
  if(req.tokenInfo.role === "vendor") {
  if(users._id && users._id.toString() !== req.tokenInfo._id){
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
const validateUserBulkFields = async (req, res) => {
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
 * @return update the user profile path
 */
const setUpdateProfilePath = async(req,res)=>{
  await userModel.updateOne({_id:req.tokenInfo._id,active:true},{$set:{profile:req.uploadFile[0].name}})
}

const roleBasedOrdersProductsReviews = async (req) => {

  // Get logged-in user
  const user = await userModel
    .findById(req.tokenInfo._id)
    .lean();

  if (!user) {
    throw new Error("User not found");
  }

  const userId = user.userId;

  //  Get orders & reviews of that user
  const orders = await orderModel
    .find({ userId })
    .lean();

  const reviews = await reviewModel
    .find({ userId })
    .lean();

  // Create review map (productId → reviews[])
  const reviewMap = {};

  for (const review of reviews) {
    if (!reviewMap[review.productId]) {
      reviewMap[review.productId] = [];
    }
    reviewMap[review.productId].push(review);
  }

  //  Combine orders with related reviews
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

// async function userDashboardAgg(userId) {
// const result = await Order.aggregate(
// [
// {
// $match: {
// active: true
// }
// },
// {
// $group: {
// _id: "$userId",
// totalOrders: {
// $sum: 1
// },
// totalProductsPurchased: {
// $sum: "$totalQuantity"
// }
// }
// },
// {
// $lookup: {
// from: "reviews",
// localField: "_id",
// foreignField: "userId",
// as: "reviews"
// }
// },
// {
// $addFields: {
// totalReviews: {
// $size: "$reviews"
// }
// }
// },
// {
// $project: {
// totalOrders: 1,
// totalProductsPurchased: 1,
// totalReviews: 1
// }
// }
// ]
// );
 
// return result[0] || {
// totalOrders: 0,
// totalProductsPurchased: 0,
// totalReviews: 0
// };
// }
 



export default {
  setCreateUserVariables,
  setUpdateUserVariables,
  insertUserData,
  getUsers,
  validateFields,
  requriedFields,
  validateUserBulkFields,
  setUpdateProfilePath,
  roleBasedOrdersProductsReviews
};
