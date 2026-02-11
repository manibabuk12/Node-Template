import Promise from "bluebird";
import crypto from "crypto";
import httpStatus from "http-status";
import mongoose from "mongoose";
import mongooseFloat from "mongoose-float";
import { getDynamicSchemaFields } from "../helpers/dynamicSchemaHelper";
import APIError from "../helpers/APIError";

const Float = mongooseFloat.loadType(mongoose);
const Schema = mongoose.Schema;

const ProjectsSchemaJson = require("../schemas/project.json");

/**
 * Default Scheamas
 */
let defaultSchemaValues = {
  password: String,
  salt: String,
  forgotPasswordExpireTimeStamp: Number,
  photo: Array,
  email: String,
  base32Secrect: String,
  role: { type: String, default: "" },
  created: {
    type: Date,
  },
  updated: {
    type: Date,
  },
  firstTimeLogin: {
    type: Boolean,
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
  listPreferences: {
    type: Schema.Types.ObjectId,
    ref: "ListPreferences",
  },
  isTwoFactorAuthentication: {
    type: Boolean,
    default: false,
  },
  otp: String,
  otpExpires: Date,
  isRemember: {
    type: Boolean,
    default: false,
  },
  isRememberLogin: Date,
  enableTwoFactAuth: {
    type: Boolean,
    default: true,
  },
  photoUrl: String,
  isGoogleUser: { type: Boolean },
  team_Lead: {
    type: Schema.ObjectId,
    ref: "Employees",
  },
  team_LeadSearch: String,
  teamMembers: [
    {
      type: Schema.ObjectId,
      ref: "Employees",
    },
  ],
  teamMembersSearch: String,
};

/**
 * Projects Schema
 */
const dynamicSchemaFields = getDynamicSchemaFields(
  "project",
  defaultSchemaValues,
  ProjectsSchemaJson
);

const ProjectsSchema = new mongoose.Schema(
  {
    ...defaultSchemaValues,
    ...ProjectsSchemaJson,
    ...dynamicSchemaFields,
  },
  { usePushEach: true }
);

/**
 * Hook a pre save method to hash the password
 */
ProjectsSchema.pre("save", function (next) {
  if (this.password && this.isModified("password")) {
    this.salt = crypto.randomBytes(16).toString("base64");
    this.password = this.hashPassword(this.password);
  }

  next();
});

/**
 *
 * @Function
 * @ForValidations (preValidatorSchema)
 *
 */
function preValidatorSchema(thisObj, next) {
  if (!thisObj) {
    const validationError = new APIError("failed to save user data.");
    validationError.name = "mongoFieldError";
    next(validationError);
  } else {
    /**@Remove the *(star) it will work */
    //*preRequired
    //*preValidator
  }
}

/**
 * Hook a pre validate method to project the local password
 */
ProjectsSchema.pre("validate", function (next) {
  if (
    this.provider === "local" &&
    this.password &&
    this.isModified("password")
  ) {
    let result = owasp.project(this.password);
    if (result.errors.length) {
      let error = result.errors.join(" ");
      this.invalidate("password", error);
    }
  }
  preValidatorSchema(this, next);

  next();
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */
ProjectsSchema.methods = {
  /**
   * Create instance method for authenticating project
   * @param {password}
   */
  authenticate(password) {
    return this.password === this.hashPassword(password);
  },

  /**
   * Create instance method for hashing a password
   * @param {password}
   */
  hashPassword(password) {
    if (this.salt && password) {
      return crypto
        .pbkdf2Sync(
          password,
          Buffer.from(this.salt, "base64"),
          10000,
          64,
          "SHA1"
        )
        .toString("base64");
    } else {
      return password;
    }
  },
};

ProjectsSchema.statics = {
  /**
   * save and update Projects
   * @param Projects
   * @returns {Promise<Projects, APIError>}
   */
  saveData(project) {
    return project.save().then((project) => {
      if (project) {
        return project;
      }
      const err = new APIError("error in project", httpStatus.NOT_FOUND);
      return Promise.reject(err);
    });
  },

  /**
   * List project in descending order of 'createdAt' timestamp.
   * @returns {Promise<project[]>}
   */
  list(query) {
    return this.find(query.filter, query.dbfields)
      .populate("team_Lead", "name name")
      .populate("teamMembers", "name ")
      .sort(query.sorting)
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .collation({ locale: "en", strength: 2 })
      .exec();
  },

  /**
   * Count of project records
   * @returns {Promise<project[]>}
   */
  totalCount(query) {
    return this.find(query.filter).countDocuments();
  },
  /**
   * Get project
   * @param {ObjectId} id - The objectId of project.
   * @returns {Promise<project, APIError>}
   */
  get(id) {
    return this.findById(id)
      .populate("team_Lead", "name name")
      .populate("teamMembers", "name ")
      .exec()
      .then((project) => {
        if (project) {
          return project;
        }
        const err = new APIError(
          "No such project exists",
          httpStatus.NOT_FOUND
        );
        return Promise.reject(err);
      });
  },

  /**
   * Find unique email.
   * @param {string} email.
   * @returns {Promise<Projects[]>}
   */
  findUniqueEmail(email) {
    email = email.toLowerCase();
    return this.findOne({
      email: email,
      active: true,
    })
      .populate("listPreferences", "columnOrder")
      .exec()
      .then((project) => project);
  },
};

export default mongoose.model("Projects", ProjectsSchema);
