import Promise from "bluebird";
import mongoose from "mongoose";
import httpStatus from "http-status";
import APIError from "../helpers/APIError";
import { getDynamicSchemaFields } from "../helpers/dynamicSchemaHelper";
import string from "joi/lib/types/string";

const LeavesSchemaJson = require("../schemas/leave.json");
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
  Employee: {
    type: Schema.ObjectId,
    ref: "Employees",
  },
  EmployeeSearch: String,
};

// let json = JSON.parse(JSON.stringify(LeavesSchemaJson));
// for(let i in json){
//   if(typeof json[i] == 'object' && json[i].match){
//     let substring = json[i].match;
//     substring = substring.substr(1,substring.length-3);
//     console.log(substring);
//     json[i].match = new RegExp(substring);
//   }
// }

/**
 * Leaves Scnext();hema
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
  "leave",
  defaultSchemaValues,
  LeavesSchemaJson
);

const LeavesSchema = new mongoose.Schema(
  {
    ...defaultSchemaValues,
    ...LeavesSchemaJson,
    ...dynamicSchemaFields,
  },
  { usePushEach: true }
);

LeavesSchema.pre("validate", function (next) {
  preValidatorSchema(this, next);

  next();
});

/**
 * Statics
 */
LeavesSchema.statics = {
  /**
   * save and update leave
   * @param leave
   * @returns {Promise<Leaves, APIError>}
   */
  saveData(leave) {
    return leave.save().then((leave) => {
      if (leave) {
        return leave;
      }
      const err = new APIError("Error in leave", httpStatus.NOT_FOUND);
      return Promise.reject(err);
    });
  },

  /**
   * Get leave
   * @param {ObjectId} id - The objectId of leave.
   * @returns {Promise<Leaves, APIError>}
   */
  get(id) {
    return this.findById(id)
      .populate("Employee", "name phone")
      .exec()
      .then((leave) => {
        if (leave) {
          return leave;
        }
        const err = new APIError("No such leave exists!", httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List leave in descending order of 'createdAt' timestamp.
   * @returns {Promise<Leaves[]>}
   */
  list(query) {
    return this.find(query.filter, query.dbfields)
      .populate("Employee", "name phone")
      .sort(query.sorting)
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .collation({ locale: "en", strength: 2 })
      .exec();
  },
  /**
   * Count of leave records
   * @returns {Promise<Leaves[]>}
   */
  totalCount(query) {
    return this.find(query.filter).countDocuments();
  },
};

/**
 * @typedef Leaves
 */
export default mongoose.model("Leaves", LeavesSchema);
