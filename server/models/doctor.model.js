import Promise from "bluebird";
import crypto from "crypto";
import httpStatus from "http-status";
import mongoose from "mongoose";
import mongooseFloat from "mongoose-float";
import { getDynamicSchemaFields } from "../helpers/dynamicSchemaHelper";
import APIError from "../helpers/APIError";

const Float = mongooseFloat.loadType(mongoose);
const Schema = mongoose.Schema;

const DoctorsSchemaJson = require("../schemas/doctor.json");

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
    ref: "Doctors",
  },
  reportingToSearch: String,
};

/**
 * Doctors Schema
 */
const dynamicSchemaFields = getDynamicSchemaFields(
  "doctor",
  defaultSchemaValues,
  DoctorsSchemaJson
);

const DoctorsSchema = new mongoose.Schema(
  {
    ...defaultSchemaValues,
    ...DoctorsSchemaJson,
    ...dynamicSchemaFields,
  },
  { usePushEach: true }
);

/**
 * Hook a pre save method to hash the password
 */
DoctorsSchema.pre("save", function (next) {
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
 * Hook a pre validate method to doctor the local password
 */
DoctorsSchema.pre("validate", function (next) {
  if (
    this.provider === "local" &&
    this.password &&
    this.isModified("password")
  ) {
    let result = owasp.doctor(this.password);
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
DoctorsSchema.methods = {
  /**
   * Create instance method for authenticating doctor
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

DoctorsSchema.statics = {
  /**
   * save and update Doctors
   * @param Doctors
   * @returns {Promise<Doctors, APIError>}
   */
  saveData(doctor) {
    return doctor.save().then((doctor) => {
      if (doctor) {
        return doctor;
      }
      const err = new APIError("error in doctor", httpStatus.NOT_FOUND);
      return Promise.reject(err);
    });
  },

  /**
   * List doctor in descending order of 'createdAt' timestamp.
   * @returns {Promise<doctor[]>}
   */
list(query) {
  return this.find(query.filter, query.dbfields)
    .populate("reportingTo", "name")
    .populate("hospitalIds","name address phone status")
    .populate(
      "patientIds", "name"
    ) 
    .sort(query.sorting)
    .skip((query.page - 1) * query.limit)
    .limit(query.limit)
    .collation({ locale: "en", strength: 2 })
    .exec();
},

  /**
   * Count of doctor records
   * @returns {Promise<doctor[]>}
   */
  totalCount(query) {
    return this.find(query.filter).countDocuments();
  },
  /**
   * Get doctor
   * @param {ObjectId} id - The objectId of doctor.
   * @returns {Promise<doctor, APIError>}
   */
get(id) {
  return this.findById(id)
    .populate("reportingTo", "name")
    // .populate({
    //   path:"patientIds",
    //   select: "name address phone status"
    // })
    // .populate({
    //   path: "hospitalIds",
    //   select: "name address phone status"
    // })
    .exec()
    .then((doctor) => {
      if (doctor) {
        return doctor;
      }
      const err = new APIError(
        "No such doctor exists",
        httpStatus.NOT_FOUND
      );
      return Promise.reject(err);
    });
},

  /**
   * Find unique email.
   * @param {string} email.
   * @returns {Promise<Doctors[]>}
   */
  findUniqueEmail(email) {
    email = email.toLowerCase();
    return this.findOne({
      email: email,
      active: true,
    })
      .populate("listPreferences", "columnOrder")
      .exec()
      .then((doctor) => doctor);
  },
};

export default mongoose.model("Doctors", DoctorsSchema);
