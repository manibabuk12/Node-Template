import Promise from "bluebird";
import mongoose from "mongoose";
import httpStatus from "http-status";
import APIError from "../helpers/APIError";
import { getDynamicSchemaFields } from "../helpers/dynamicSchemaHelper";
import string from "joi/lib/types/string";

const ReviewsSchemaJson = require("../schemas/review.json");
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

// let json = JSON.parse(JSON.stringify(ReviewsSchemaJson));
// for(let i in json){
//   if(typeof json[i] == 'object' && json[i].match){
//     let substring = json[i].match;
//     substring = substring.substr(1,substring.length-3);
//     console.log(substring);
//     json[i].match = new RegExp(substring);
//   }
// }

/**
 * Reviews Scnext();hema
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
  "review",
  defaultSchemaValues,
  ReviewsSchemaJson
);

const ReviewsSchema = new mongoose.Schema(
  {
    ...defaultSchemaValues,
    ...ReviewsSchemaJson,
    ...dynamicSchemaFields,
  },
  { usePushEach: true }
);

ReviewsSchema.pre("validate", function (next) {
  preValidatorSchema(this, next);

  next();
});

/**
 * Statics
 */
ReviewsSchema.statics = {
  /**
   * save and update review
   * @param review
   * @returns {Promise<Reviews, APIError>}
   */
  saveData(review) {
    return review.save().then((review) => {
      if (review) {
        return review;
      }
      const err = new APIError("Error in review", httpStatus.NOT_FOUND);
      return Promise.reject(err);
    });
  },

  /**
   * Get review
   * @param {ObjectId} id - The objectId of review.
   * @returns {Promise<Reviews, APIError>}
   */
  get(id) {
    return this.findById(id)
      .populate("assignedTo", "name name")
      .exec()
      .then((review) => {
        if (review) {
          return review;
        }
        const err = new APIError("No such review exists!", httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List review in descending order of 'createdAt' timestamp.
   * @returns {Promise<Reviews[]>}
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
   * Count of review records
   * @returns {Promise<Reviews[]>}
   */
  totalCount(query) {
    return this.find(query.filter).countDocuments();
  },
};

/**
 * @typedef Reviews
 */
export default mongoose.model("Reviews", ReviewsSchema);
