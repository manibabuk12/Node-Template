import Promise from "bluebird";
import mongoose from "mongoose";
import httpStatus from "http-status";
import APIError from "../helpers/APIError";
import { getDynamicSchemaFields } from "../helpers/dynamicSchemaHelper";
import string from "joi/lib/types/string";
 
const OrdersSchemaJson = require("../schemas/order.json");
const Schema = mongoose.Schema;
 
/**
* Default Scheamas
*/
let defaultSchemaValues = {
created: {
type: Date,
},
updated: {
type: Date,
},
active: {
type: Boolean,
default: true,
},
createdBy: {
type: Schema.ObjectId,
},
createdByName: String,
updatedByName: String,
assignedTo: {
type: Schema.ObjectId,
ref: "Employees",
},
assignedToSearch: String,
};
 
// let json = JSON.parse(JSON.stringify(OrdersSchemaJson));
// for(let i in json){
// if(typeof json[i] == 'object' && json[i].match){
// let substring = json[i].match;
// substring = substring.substr(1,substring.length-3);
// console.log(substring);
// json[i].match = new RegExp(substring);
// }
// }
 
/**
* Orders Scnext();hema
*/
 
function preValidatorSchema(thisObj, next) {
if (!thisObj) {
const validationError = new APIError("failed to save user data.");
validationError.name = "mongoFieldError";
next(validationError);
} else {
//preRequired
//preValidator
}
}
 
const dynamicSchemaFields = getDynamicSchemaFields(
"order",
defaultSchemaValues,
OrdersSchemaJson
);
 
const OrdersSchema = new mongoose.Schema(
{
...defaultSchemaValues,
...OrdersSchemaJson,
...dynamicSchemaFields,
},
{ usePushEach: true }
);
 
OrdersSchema.pre("validate", function (next) {
preValidatorSchema(this, next);
 
next();
});
 
/**
* Statics
*/
OrdersSchema.statics = {
/**
* save and update order
* @param order
* @returns {Promise<Orders, APIError>}
*/
saveData(order) {
return order.save().then((order) => {
if (order) {
return order;
}
const err = new APIError("Error in order", httpStatus.NOT_FOUND);
return Promise.reject(err);
});
},
 
/**
* Get order
* @param {ObjectId} id - The objectId of order.
* @returns {Promise<Orders, APIError>}
*/
get(id) {
return this.findById(id)
.populate("assignedTo", "name name")
.exec()
.then((order) => {
if (order) {
return order;
}
const err = new APIError("No such order exists!", httpStatus.NOT_FOUND);
return Promise.reject(err);
});
},
 
/**
* List order in descending order of 'createdAt' timestamp.
* @returns {Promise<Orders[]>}
*/
list(query) {
return this.find(query.filter, query.dbfields)
.populate("assignedTo", "name name")
.sort(query.sorting)
.skip((query.page - 1) * query.limit)
.limit(query.limit)
.collation({ locale: "en", strength: 2 })
.exec();
},
/**
* Count of order records
* @returns {Promise<Orders[]>}
*/
totalCount(query) {
return this.find(query.filter).countDocuments();
},
};
 
/**
* @typedef Orders
*/
export default mongoose.model("Orders", OrdersSchema);