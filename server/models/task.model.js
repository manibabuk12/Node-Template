import Promise from "bluebird";
import mongoose from "mongoose";
import httpStatus from "http-status";
import APIError from "../helpers/APIError";
import { getDynamicSchemaFields } from "../helpers/dynamicSchemaHelper";
import string from "joi/lib/types/string";

const TasksSchemaJson = require("../schemas/task.json");
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

// let json = JSON.parse(JSON.stringify(TasksSchemaJson));
// for(let i in json){
//   if(typeof json[i] == 'object' && json[i].match){
//     let substring = json[i].match;
//     substring = substring.substr(1,substring.length-3);
//     console.log(substring);
//     json[i].match = new RegExp(substring);
//   }
// }

/**
 * Tasks Scnext();hema
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
  "task",
  defaultSchemaValues,
  TasksSchemaJson
);

const TasksSchema = new mongoose.Schema(
  {
    ...defaultSchemaValues,
    ...TasksSchemaJson,
    ...dynamicSchemaFields,
  },
  { usePushEach: true }
);

TasksSchema.pre("validate", function (next) {
  preValidatorSchema(this, next);

  next();
});

/**
 * Statics
 */
TasksSchema.statics = {
  /**
   * save and update task
   * @param task
   * @returns {Promise<Tasks, APIError>}
   */
  saveData(task) {
    return task.save().then((task) => {
      if (task) {
        return task;
      }
      const err = new APIError("Error in task", httpStatus.NOT_FOUND);
      return Promise.reject(err);
    });
  },

  /**
   * Get task
   * @param {ObjectId} id - The objectId of task.
   * @returns {Promise<Tasks, APIError>}
   */
  get(id) {
    return this.findById(id)
      .populate("assignedTo", "name name")
      .exec()
      .then((task) => {
        if (task) {
          return task;
        }
        const err = new APIError("No such task exists!", httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  /**
   * List task in descending order of 'createdAt' timestamp.
   * @returns {Promise<Tasks[]>}
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
   * Count of task records
   * @returns {Promise<Tasks[]>}
   */
  totalCount(query) {
    return this.find(query.filter).countDocuments();
  },
};

/**
 * @typedef Tasks
 */
export default mongoose.model("Tasks", TasksSchema);
