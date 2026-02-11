import Promise from "bluebird";
import mongoose from "mongoose";
import httpStatus from "http-status";
import APIError from "../helpers/APIError";
import { getDynamicSchemaFields } from "../helpers/dynamicSchemaHelper";
import string from "joi/lib/types/string";

const CandidatesSchemaJson = require("../schemas/candidate.json");
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

// let json = JSON.parse(JSON.stringify(CandidatesSchemaJson));
// for(let i in json){
//   if(typeof json[i] == 'object' && json[i].match){
//     let substring = json[i].match;
//     substring = substring.substr(1,substring.length-3);
//     console.log(substring);
//     json[i].match = new RegExp(substring);
//   }
// }

/**
 * Candidates Scnext();hema
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
  "candidate",
  defaultSchemaValues,
  CandidatesSchemaJson
);

const CandidatesSchema = new mongoose.Schema(
  {
    ...defaultSchemaValues,
    ...CandidatesSchemaJson,
    ...dynamicSchemaFields,
  },
  { usePushEach: true }
);

CandidatesSchema.pre("validate", function (next) {
  preValidatorSchema(this, next);

  next();
});

/**
 * Statics
 */
CandidatesSchema.statics = {
  /**
   * save and update candidate
   * @param candidate
   * @returns {Promise<Candidates, APIError>}
   */
  saveData(candidate) {
    return candidate.save().then((candidate) => {
      if (candidate) {
        return candidate;
      }
      const err = new APIError("Error in candidate", httpStatus.NOT_FOUND);
      return Promise.reject(err);
    });
  },

  /**
   * Get candidate
   * @param {ObjectId} id - The objectId of candidate.
   * @returns {Promise<Candidates, APIError>}
   */
  get(id) {
    return this.findById(id)
      .populate("assignedTo", "name name")
      .exec()
      .then((candidate) => {
        if (candidate) {
          return candidate;
        }
        const err = new APIError("No such candidate exists!", httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List candidate in descending order of 'createdAt' timestamp.
   * @returns {Promise<Candidates[]>}
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
   * Count of candidate records
   * @returns {Promise<Candidates[]>}
   */
  totalCount(query) {
    return this.find(query.filter).countDocuments();
  },
};

/**
 * @typedef Candidates
 */
export default mongoose.model("Candidates", CandidatesSchema);
