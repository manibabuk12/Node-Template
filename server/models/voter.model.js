import Promise from "bluebird";
import mongoose from "mongoose";
import httpStatus from "http-status";
import APIError from "../helpers/APIError";
import { getDynamicSchemaFields } from "../helpers/dynamicSchemaHelper";
import string from "joi/lib/types/string";

const VotersSchemaJson = require("../schemas/voter.json");
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

// let json = JSON.parse(JSON.stringify(VotersSchemaJson));
// for(let i in json){
//   if(typeof json[i] == 'object' && json[i].match){
//     let substring = json[i].match;
//     substring = substring.substr(1,substring.length-3);
//     console.log(substring);
//     json[i].match = new RegExp(substring);
//   }
// }

/**
 * Voters Scnext();hema
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
  "voter",
  defaultSchemaValues,
  VotersSchemaJson
);

const VotersSchema = new mongoose.Schema(
  {
    ...defaultSchemaValues,
    ...VotersSchemaJson,
    ...dynamicSchemaFields,
  },
  { usePushEach: true }
);

VotersSchema.pre("validate", function (next) {
  preValidatorSchema(this, next);

  next();
});

/**
 * Statics
 */
VotersSchema.statics = {
  /**
   * save and update voter
   * @param voter
   * @returns {Promise<Voters, APIError>}
   */
  saveData(voter) {
    return voter.save().then((voter) => {
      if (voter) {
        return voter;
      }
      const err = new APIError("Error in voter", httpStatus.NOT_FOUND);
      return Promise.reject(err);
    });
  },

  /**
   * Get voter
   * @param {ObjectId} id - The objectId of voter.
   * @returns {Promise<Voters, APIError>}
   */
  get(id) {
    return this.findById(id)
      .populate("assignedTo", "name name")
      .exec()
      .then((voter) => {
        if (voter) {
          return voter;
        }
        const err = new APIError("No such voter exists!", httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List voter in descending order of 'createdAt' timestamp.
   * @returns {Promise<Voters[]>}
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
   * Count of voter records
   * @returns {Promise<Voters[]>}
   */
  totalCount(query) {
    return this.find(query.filter).countDocuments();
  },
};

/**
 * @typedef Voters
 */
export default mongoose.model("Voters", VotersSchema);
