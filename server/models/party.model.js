import Promise from "bluebird";
import mongoose from "mongoose";
import httpStatus from "http-status";
import APIError from "../helpers/APIError";
import { getDynamicSchemaFields } from "../helpers/dynamicSchemaHelper";
import string from "joi/lib/types/string";

const PartysSchemaJson = require("../schemas/party.json");
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

// let json = JSON.parse(JSON.stringify(PartysSchemaJson));
// for(let i in json){
//   if(typeof json[i] == 'object' && json[i].match){
//     let substring = json[i].match;
//     substring = substring.substr(1,substring.length-3);
//     console.log(substring);
//     json[i].match = new RegExp(substring);
//   }
// }

/**
 * Partys Scnext();hema
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
  "party",
  defaultSchemaValues,
  PartysSchemaJson
);

const PartysSchema = new mongoose.Schema(
  {
    ...defaultSchemaValues,
    ...PartysSchemaJson,
    ...dynamicSchemaFields,
  },
  { usePushEach: true }
);

PartysSchema.pre("validate", function (next) {
  preValidatorSchema(this, next);

  next();
});

/**
 * Statics
 */
PartysSchema.statics = {
  /**
   * save and update party
   * @param party
   * @returns {Promise<Partys, APIError>}
   */
  saveData(party) {
    return party.save().then((party) => {
      if (party) {
        return party;
      }
      const err = new APIError("Error in party", httpStatus.NOT_FOUND);
      return Promise.reject(err);
    });
  },

  /**
   * Get party
   * @param {ObjectId} id - The objectId of party.
   * @returns {Promise<Partys, APIError>}
   */
  get(id) {
    return this.findById(id)
      .populate("assignedTo", "name name")
      .exec()
      .then((party) => {
        if (party) {
          return party;
        }
        const err = new APIError("No such party exists!", httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List party in descending order of 'createdAt' timestamp.
   * @returns {Promise<Partys[]>}
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
   * Count of party records
   * @returns {Promise<Partys[]>}
   */
  totalCount(query) {
    return this.find(query.filter).countDocuments();
  },
};

/**
 * @typedef Partys
 */
export default mongoose.model("Partys", PartysSchema);
