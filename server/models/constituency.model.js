import Promise from "bluebird";
import mongoose from "mongoose";
import httpStatus from "http-status";
import APIError from "../helpers/APIError";
import { getDynamicSchemaFields } from "../helpers/dynamicSchemaHelper";
import string from "joi/lib/types/string";

const ConstituencysSchemaJson = require("../schemas/constituency.json");
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

// let json = JSON.parse(JSON.stringify(ConstituencysSchemaJson));
// for(let i in json){
//   if(typeof json[i] == 'object' && json[i].match){
//     let substring = json[i].match;
//     substring = substring.substr(1,substring.length-3);
//     console.log(substring);
//     json[i].match = new RegExp(substring);
//   }
// }

/**
 * Constituencys Scnext();hema
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
  "constituency",
  defaultSchemaValues,
  ConstituencysSchemaJson
);

const ConstituencysSchema = new mongoose.Schema(
  {
    ...defaultSchemaValues,
    ...ConstituencysSchemaJson,
    ...dynamicSchemaFields,
  },
  { usePushEach: true }
);

ConstituencysSchema.pre("validate", function (next) {
  preValidatorSchema(this, next);

  next();
});

/**
 * Statics
 */
ConstituencysSchema.statics = {
  /**
   * save and update constituency
   * @param constituency
   * @returns {Promise<Constituencys, APIError>}
   */
  saveData(constituency) {
    return constituency.save().then((constituency) => {
      if (constituency) {
        return constituency;
      }
      const err = new APIError("Error in constituency", httpStatus.NOT_FOUND);
      return Promise.reject(err);
    });
  },

  /**
   * Get constituency
   * @param {ObjectId} id - The objectId of constituency.
   * @returns {Promise<Constituencys, APIError>}
   */
  get(id) {
    return this.findById(id)
      .populate("assignedTo", "name name")
      .exec()
      .then((constituency) => {
        if (constituency) {
          return constituency;
        }
        const err = new APIError("No such constituency exists!", httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List constituency in descending order of 'createdAt' timestamp.
   * @returns {Promise<Constituencys[]>}
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
   * Count of constituency records
   * @returns {Promise<Constituencys[]>}
   */
  totalCount(query) {
    return this.find(query.filter).countDocuments();
  },
};

/**
 * @typedef Constituencys
 */
export default mongoose.model("Constituencys", ConstituencysSchema);
