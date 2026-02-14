import Promise from "bluebird";
import crypto from "crypto";
import httpStatus from "http-status";
import mongoose from "mongoose";
import mongooseFloat from "mongoose-float";
import { getDynamicSchemaFields } from "../helpers/dynamicSchemaHelper";
import APIError from "../helpers/APIError";


const Float = mongooseFloat.loadType(mongoose);
const Schema = mongoose.Schema;

const UsersSchemaJson = require("../schemas/user.json");

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
  reportingTo: {
    type: Schema.ObjectId,
    ref: "Users",
  },
  reportingToSearch: String,
};

/**
 * Users Schema
 */
const dynamicSchemaFields = getDynamicSchemaFields(
  "user",
  defaultSchemaValues,
  UsersSchemaJson
);

const UsersSchema = new mongoose.Schema(
  {
    ...defaultSchemaValues,
    ...UsersSchemaJson,
    ...dynamicSchemaFields,
  },
  { usePushEach: true }
);

/**
 * Hook a pre save method to hash the password
 */
UsersSchema.pre("save", function (next) {
  try{

  if(this.firstName || this.lastName){
    this.fullName = `${this.firstName || ""} ${this.lastName || ""}`.trim();
  }
  if (this.password && this.isModified("password")) {
    this.salt = crypto.randomBytes(16).toString("base64");
    this.password = this.hashPassword(this.password);
  }

  next();
}catch(err){}
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
 * Hook a pre validate method to user the local password
 */
UsersSchema.pre("validate", function (next) {
  if (
    this.provider === "local" &&
    this.password &&
    this.isModified("password")
  ) {
    let result = owasp.user(this.password);
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
UsersSchema.methods = {
  /**
   * Create instance method for authenticating user
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

UsersSchema.statics = {
  /**
   * save and update Users
   * @param Users
   * @returns {Promise<Users, APIError>}
   */
  saveData(user) {
    return user.save().then((user) => {
      if (user) {
        return user;
      }
      const err = new APIError("error in user", httpStatus.NOT_FOUND);
      return Promise.reject(err);
    });
  },

  /**
   * List user in descending order of 'createdAt' timestamp.
   * @returns {Promise<user[]>}
   */
  list(query) {
    return this.find(query.filter, query.dbfields)
      .populate("reportingTo", "name ")
      .sort(query.sorting)
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .collation({ locale: "en", strength: 2 })
      .exec();
  },

  /**
   * Count of user records
   * @returns {Promise<user[]>}
   */
  totalCount(query) {
    return this.find(query.filter).countDocuments();
  },
  /**
   * Get user
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<user, APIError>}
   */
  get(id) {
    return this.findById(id)
      .populate("reportingTo", "name ")
      .exec()
      .then((user) => {
        if (user) {
          return user;
        }
        const err = new APIError(
          "No such user exists",
          httpStatus.NOT_FOUND
        );
        return Promise.reject(err);
      });
  },

  /**
   * Find unique email.
   * @param {string} email.
   * @returns {Promise<Users[]>}
   */
  findUniqueEmail(email) {
    email = email.toLowerCase();
    return this.findOne({
      email: email,
      active: true,
    })
      .populate("listPreferences", "columnOrder")
      .exec()
      .then((user) => user);
  },
};

export default mongoose.model("Users", UsersSchema);
