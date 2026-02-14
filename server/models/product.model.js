import Promise from "bluebird";
import mongoose from "mongoose";
import httpStatus from "http-status";
import APIError from "../helpers/APIError";
import { getDynamicSchemaFields } from "../helpers/dynamicSchemaHelper";
import string from "joi/lib/types/string";

const ProductsSchemaJson = require("../schemas/product.json");
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

// let json = JSON.parse(JSON.stringify(ProductsSchemaJson));
// for(let i in json){
//   if(typeof json[i] == 'object' && json[i].match){
//     let substring = json[i].match;
//     substring = substring.substr(1,substring.length-3);
//     console.log(substring);
//     json[i].match = new RegExp(substring);
//   }
// }

/**
 * Products Scnext();hema
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
  "product",
  defaultSchemaValues,
  ProductsSchemaJson
);

const ProductsSchema = new mongoose.Schema(
  {
    ...defaultSchemaValues,
    ...ProductsSchemaJson,
    ...dynamicSchemaFields,
  },
  { usePushEach: true }
);

ProductsSchema.pre("validate", function (next) {
  preValidatorSchema(this, next);

  next();
});

/**
 * Statics
 */
ProductsSchema.statics = {
  /**
   * save and update product
   * @param product
   * @returns {Promise<Products, APIError>}
   */
  saveData(product) {
    return product.save().then((product) => {
      if (product) {
        return product;
      }
      const err = new APIError("Error in product", httpStatus.NOT_FOUND);
      return Promise.reject(err);
    });
  },

  /**
   * Get product
   * @param {ObjectId} id - The objectId of product.
   * @returns {Promise<Products, APIError>}
   */
  get(id) {
    return this.findById(id)
      .populate("assignedTo", "name name")
      .exec()
      .then((product) => {
        if (product) {
          return product;
        }
        const err = new APIError("No such product exists!", httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List product in descending order of 'createdAt' timestamp.
   * @returns {Promise<Products[]>}
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
   * Count of product records
   * @returns {Promise<Products[]>}
   */
  totalCount(query) {
    return this.find(query.filter).countDocuments();
  },
};

/**
 * @typedef Products
 */
export default mongoose.model("Products", ProductsSchema);
