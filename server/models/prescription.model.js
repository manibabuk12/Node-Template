import Promise from "bluebird";
import mongoose from "mongoose";
import httpStatus from "http-status";
import APIError from "../helpers/APIError";
import { getDynamicSchemaFields } from "../helpers/dynamicSchemaHelper";
import string from "joi/lib/types/string";

const PrescriptionsSchemaJson = require("../schemas/prescription.json");
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
  nameLower:String,
  name :String
};

// let json = JSON.parse(JSON.stringify(PrescriptionsSchemaJson));
// for(let i in json){
//   if(typeof json[i] == 'object' && json[i].match){
//     let substring = json[i].match;
//     substring = substring.substr(1,substring.length-3);
//     console.log(substring);
//     json[i].match = new RegExp(substring);
//   }
// }

/**
 * Prescriptions Scnext();hema
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
  "prescription",
  defaultSchemaValues,
  PrescriptionsSchemaJson
);

const PrescriptionsSchema = new mongoose.Schema(
  {
    ...defaultSchemaValues,
    ...PrescriptionsSchemaJson,
    ...dynamicSchemaFields,
  },
  { usePushEach: true }
);

PrescriptionsSchema.pre("validate", function (next) {
  preValidatorSchema(this, next);

  next();
});

/**
 * Statics
 */
PrescriptionsSchema.statics = {
  /**
   * save and update prescription
   * @param prescription
   * @returns {Promise<Prescriptions, APIError>}
   */
  saveData(prescription) {
    return prescription.save().then((prescription) => {
      if (prescription) {
        return prescription;
      }
      const err = new APIError("Error in prescription", httpStatus.NOT_FOUND);
      return Promise.reject(err);
    });
  },

  /**
   * Get prescription
   * @param {ObjectId} id - The objectId of prescription.
   * @returns {Promise<Prescriptions, APIError>}
   */
  get(id) {
    return this.findById(id)
      .populate("assignedTo", "name name")
      .exec()
      .then((prescription) => {
        if (prescription) {
          return prescription;
        }
        const err = new APIError("No such prescription exists!", httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List prescription in descending order of 'createdAt' timestamp.
   * @returns {Promise<Prescriptions[]>}
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
   * Count of prescription records
   * @returns {Promise<Prescriptions[]>}
   */
  totalCount(query) {
    return this.find(query.filter).countDocuments();
  },
};

/**
 * @typedef Prescriptions
 */
export default mongoose.model("Prescriptions", PrescriptionsSchema);
