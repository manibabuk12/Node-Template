import Promise from "bluebird";
import mongoose from "mongoose";
import httpStatus from "http-status";
import APIError from "../helpers/APIError";
import { getDynamicSchemaFields } from "../helpers/dynamicSchemaHelper";
import string from "joi/lib/types/string";

const HospitalsSchemaJson = require("../schemas/hospital.json");
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

// let json = JSON.parse(JSON.stringify(HospitalsSchemaJson));
// for(let i in json){
//   if(typeof json[i] == 'object' && json[i].match){
//     let substring = json[i].match;
//     substring = substring.substr(1,substring.length-3);
//     console.log(substring);
//     json[i].match = new RegExp(substring);
//   }
// }

/**
 * Hospitals Scnext();hema
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
  "hospital",
  defaultSchemaValues,
  HospitalsSchemaJson
);

const HospitalsSchema = new mongoose.Schema(
  {
    ...defaultSchemaValues,
    ...HospitalsSchemaJson,
    ...dynamicSchemaFields,
  },
  { usePushEach: true }
);

HospitalsSchema.pre("validate", function (next) {
  preValidatorSchema(this, next);

  next();
});

/**
 * Statics
 */
HospitalsSchema.statics = {
  /**
   * save and update hospital
   * @param hospital
   * @returns {Promise<Hospitals, APIError>}
   */
  saveData(hospital) {
    return hospital.save().then((hospital) => {
      if (hospital) {
        return hospital;
      }
      const err = new APIError("Error in hospital", httpStatus.NOT_FOUND);
      return Promise.reject(err);
    });
  },

  /**
   * Get hospital
   * @param {ObjectId} id - The objectId of hospital.
   * @returns {Promise<Hospitals, APIError>}
   */
  get(id) {
    return this.findById(id)
      .populate("assignedTo", "name name")
      .exec()
      .then((hospital) => {
        if (hospital) {
          return hospital;
        }
        const err = new APIError("No such hospital exists!", httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List hospital in descending order of 'createdAt' timestamp.
   * @returns {Promise<Hospitals[]>}
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
   * Count of hospital records
   * @returns {Promise<Hospitals[]>}
   */
  totalCount(query) {
    return this.find(query.filter).countDocuments();
  },
};

/**
 * @typedef Hospitals
 */
export default mongoose.model("Hospitals", HospitalsSchema);
