import Promise from "bluebird";
import mongoose from "mongoose";
import httpStatus from "http-status";
import APIError from "../helpers/APIError";
import { getDynamicSchemaFields } from "../helpers/dynamicSchemaHelper";
import string from "joi/lib/types/string";

const VotesSchemaJson = require("../schemas/vote.json");
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

// let json = JSON.parse(JSON.stringify(VotesSchemaJson));
// for(let i in json){
//   if(typeof json[i] == 'object' && json[i].match){
//     let substring = json[i].match;
//     substring = substring.substr(1,substring.length-3);
//     console.log(substring);
//     json[i].match = new RegExp(substring);
//   }
// }

/**
 * Votes Scnext();hema
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
  "vote",
  defaultSchemaValues,
  VotesSchemaJson
);

const VotesSchema = new mongoose.Schema(
  {
    ...defaultSchemaValues,
    ...VotesSchemaJson,
    ...dynamicSchemaFields,
  },
  { usePushEach: true }
);

VotesSchema.pre("validate", function (next) {
  preValidatorSchema(this, next);

  next();
});

/**
 * Statics
 */
VotesSchema.statics = {
  /**
   * save and update vote
   * @param vote
   * @returns {Promise<Votes, APIError>}
   */
  saveData(vote) {
    return vote.save().then((vote) => {
      if (vote) {
        return vote;
      }
      const err = new APIError("Error in vote", httpStatus.NOT_FOUND);
      return Promise.reject(err);
    });
  },

  /**
   * Get vote
   * @param {ObjectId} id - The objectId of vote.
   * @returns {Promise<Votes, APIError>}
   */
  get(id) {
    return this.findById(id)
      .populate("assignedTo", "name name")
      .exec()
      .then((vote) => {
        if (vote) {
          return vote;
        }
        const err = new APIError("No such vote exists!", httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List vote in descending order of 'createdAt' timestamp.
   * @returns {Promise<Votes[]>}
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
   * Count of vote records
   * @returns {Promise<Votes[]>}
   */
  totalCount(query) {
    return this.find(query.filter).countDocuments();
  },
};

/**
 * @typedef Votes
 */
export default mongoose.model("Votes", VotesSchema);
