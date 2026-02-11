import Promise from "bluebird";
import mongoose from "mongoose";
import httpStatus from "http-status";
import APIError from "../helpers/APIError";
import { getDynamicSchemaFields } from "../helpers/dynamicSchemaHelper";
import string from "joi/lib/types/string";

const ReportsSchemaJson = require("../schemas/report.json");
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

// let json = JSON.parse(JSON.stringify(ReportsSchemaJson));
// for(let i in json){
//   if(typeof json[i] == 'object' && json[i].match){
//     let substring = json[i].match;
//     substring = substring.substr(1,substring.length-3);
//     console.log(substring);
//     json[i].match = new RegExp(substring);
//   }
// }

/**
 * Reports Scnext();hema
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
  "report",
  defaultSchemaValues,
  ReportsSchemaJson
);

const ReportsSchema = new mongoose.Schema(
  {
    ...defaultSchemaValues,
    ...ReportsSchemaJson,
    ...dynamicSchemaFields,
  },
  { usePushEach: true }
);

ReportsSchema.pre("validate", function (next) {
  preValidatorSchema(this, next);

  next();
});

/**
 * Statics
 */
ReportsSchema.statics = {
  /**
   * save and update report
   * @param report
   * @returns {Promise<Reports, APIError>}
   */
  saveData(report) {
    return report.save().then((report) => {
      if (report) {
        return report;
      }
      const err = new APIError("Error in report", httpStatus.NOT_FOUND);
      return Promise.reject(err);
    });
  },

  /**
   * Get report
   * @param {ObjectId} id - The objectId of report.
   * @returns {Promise<Reports, APIError>}
   */
  get(id) {
    return this.findById(id)
      .populate("assignedTo", "name name")
      .exec()
      .then((report) => {
        if (report) {
          return report;
        }
        const err = new APIError("No such report exists!", httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List report in descending order of 'createdAt' timestamp.
   * @returns {Promise<Reports[]>}
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
   * Count of report records
   * @returns {Promise<Reports[]>}
   */
  totalCount(query) {
    return this.find(query.filter).countDocuments();
  },
};

/**
 * @typedef Reports
 */
export default mongoose.model("Reports", ReportsSchema);
