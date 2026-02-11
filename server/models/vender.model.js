import Promise from "bluebird";
import crypto from "crypto";
import httpStatus from "http-status";
import mongoose from "mongoose";
import mongooseFloat from "mongoose-float";
import { getDynamicSchemaFields } from "../helpers/dynamicSchemaHelper";
import APIError from "../helpers/APIError";

const Float = mongooseFloat.loadType(mongoose);
const Schema = mongoose.Schema;

const VendorsSchemaJson = require("../schemas/vendor.json");

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
    ref: "Vendors",
  },
  reportingToSearch: String,
};

/**
 * Vendors Schema
 */
const dynamicSchemaFields = getDynamicSchemaFields(
  "vendor",
  defaultSchemaValues,
  VendorsSchemaJson
);

const VendorsSchema = new mongoose.Schema(
  {
    ...defaultSchemaValues,
    ...VendorsSchemaJson,
    ...dynamicSchemaFields,
  },
  { usePushEach: true }
);

/**
 * Hook a pre save method to hash the password
 */
VendorsSchema.pre("save", function (next) {
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
 * Hook a pre validate method to vendor the local password
 */
VendorsSchema.pre("validate", function (next) {
  if (
    this.provider === "local" &&
    this.password &&
    this.isModified("password")
  ) {
    let result = owasp.vendor(this.password);
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
VendorsSchema.methods = {
  /**
   * Create instance method for authenticating vendor
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

VendorsSchema.statics = {
  /**
   * save and update Vendors
   * @param Vendors
   * @returns {Promise<Vendors, APIError>}
   */
  saveData(vendor) {
    return vendor.save().then((vendor) => {
      if (vendor) {
        return vendor;
      }
      const err = new APIError("error in vendor", httpStatus.NOT_FOUND);
      return Promise.reject(err);
    });
  },

  /**
   * List vendor in descending order of 'createdAt' timestamp.
   * @returns {Promise<vendor[]>}
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
   * Count of vendor records
   * @returns {Promise<vendor[]>}
   */
  totalCount(query) {
    return this.find(query.filter).countDocuments();
  },
  /**
   * Get vendor
   * @param {ObjectId} id - The objectId of vendor.
   * @returns {Promise<vendor, APIError>}
   */
  get(id) {
    return this.findById(id)
      .populate("reportingTo", "name ")
      .exec()
      .then((vendor) => {
        if (vendor) {
          return vendor;
        }
        const err = new APIError(
          "No such vendor exists",
          httpStatus.NOT_FOUND
        );
        return Promise.reject(err);
      });
  },

  /**
   * Find unique email.
   * @param {string} email.
   * @returns {Promise<Vendors[]>}
   */
  findUniqueEmail(email) {
    email = email.toLowerCase();
    return this.findOne({
      email: email,
      active: true,
    })
      .populate("listPreferences", "columnOrder")
      .exec()
      .then((vendor) => vendor);
  },
};

export default mongoose.model("Vendors", VendorsSchema);
