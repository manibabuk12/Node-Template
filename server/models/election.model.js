import Promise from "bluebird";
import mongoose from "mongoose";
import httpStatus from "http-status";
import APIError from "../helpers/APIError";
import { getDynamicSchemaFields } from "../helpers/dynamicSchemaHelper";
import string from "joi/lib/types/string";

const ElectionsSchemaJson = require("../schemas/election.json");
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

// let json = JSON.parse(JSON.stringify(ElectionsSchemaJson));
// for(let i in json){
//   if(typeof json[i] == 'object' && json[i].match){
//     let substring = json[i].match;
//     substring = substring.substr(1,substring.length-3);
//     console.log(substring);
//     json[i].match = new RegExp(substring);
//   }
// }

/**
 * Elections Scnext();hema
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
  "election",
  defaultSchemaValues,
  ElectionsSchemaJson
);

const ElectionsSchema = new mongoose.Schema(
  {
    ...defaultSchemaValues,
    ...ElectionsSchemaJson,
    ...dynamicSchemaFields,
  },
  { usePushEach: true }
);

ElectionsSchema.pre("validate", function (next) {
  preValidatorSchema(this, next);

  next();
});

/**
 * Statics
 */
ElectionsSchema.statics = {
  /**
   * save and update election
   * @param election
   * @returns {Promise<Elections, APIError>}
   */
  saveData(election) {
    return election.save().then((election) => {
      if (election) {
        return election;
      }
      const err = new APIError("Error in election", httpStatus.NOT_FOUND);
      return Promise.reject(err);
    });
  },

  /**
   * Get election
   * @param {ObjectId} id - The objectId of election.
   * @returns {Promise<Elections, APIError>}
   */
  get(id) {
    return this.findById(id)
      .populate("assignedTo", "name name")
      .exec()
      .then((election) => {
        if (election) {
          return election;
        }
        const err = new APIError("No such election exists!", httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List election in descending order of 'createdAt' timestamp.
   * @returns {Promise<Elections[]>}
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
   * Count of election records
   * @returns {Promise<Elections[]>}
   */
  totalCount(query) {
    return this.find(query.filter).countDocuments();
  },
};

/**
 * @typedef Elections
 */
export default mongoose.model("Elections", ElectionsSchema);
