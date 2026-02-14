import Promise from "bluebird";
import crypto from "crypto";
import httpStatus from "http-status";
import mongoose from "mongoose";
import mongooseFloat from "mongoose-float";
import { getDynamicSchemaFields } from "../helpers/dynamicSchemaHelper";
import APIError from "../helpers/APIError";

const Float = mongooseFloat.loadType(mongoose);
const Schema = mongoose.Schema;

const PatientsSchemaJson = require("../schemas/patient.json");

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
    ref: "Patients",
  },
  reportingToSearch: String,
};

/**
 * Patients Schema
 */
const dynamicSchemaFields = getDynamicSchemaFields(
  "patient",
  defaultSchemaValues,
  PatientsSchemaJson
);

const PatientsSchema = new mongoose.Schema(
  {
    ...defaultSchemaValues,
    ...PatientsSchemaJson,
    ...dynamicSchemaFields,
  },
  { usePushEach: true }
);

/**
 * Hook a pre save method to hash the password
 */
PatientsSchema.pre("save", function (next) {
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
 * Hook a pre validate method to patient the local password
 */
PatientsSchema.pre("validate", function (next) {
  if (
    this.provider === "local" &&
    this.password &&
    this.isModified("password")
  ) {
    let result = owasp.patient(this.password);
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
PatientsSchema.methods = {
  /**
   * Create instance method for authenticating patient
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

PatientsSchema.statics = {
  /**
   * save and update Patients
   * @param Patients
   * @returns {Promise<Patients, APIError>}
   */
  saveData(patient) {
    return patient.save().then((patient) => {
      if (patient) {
        return patient;
      }
      const err = new APIError("error in patient", httpStatus.NOT_FOUND);
      return Promise.reject(err);
    });
  },

  /**
   * List patient in descending order of 'createdAt' timestamp.
   * @returns {Promise<patient[]>}
   */
list(query) {
  return this.find(query.filter, query.dbfields)
    .populate("reportingTo", "name")
    .populate({
      path: "doctorId",
      select: "name email specialization"
    })
    .populate({
      path: "prescriptionId",
      select: "medications dosage"
    })
    .populate({
      path: "reportId",
      select: "name result created createdAt"
    })
    .sort(query.sorting)
    .skip((query.page - 1) * query.limit)
    .limit(query.limit)
    .collation({ locale: "en", strength: 2 })
    .exec();
},

  /**
   * Count of patient records
   * @returns {Promise<patient[]>}
   */
  totalCount(query) {
    return this.find(query.filter).countDocuments();
  },
  /**
   * Get patient
   * @param {ObjectId} id - The objectId of patient.
   * @returns {Promise<patient, APIError>}
   */
get(id) {
  return this.findById(id)
    .populate({
      path: "doctorId",
      select: "name email specialization"
    })
    .populate({
      path: "prescriptionId",
      select: "medications dosage"
    })
    .populate({
      path: "reportId",
      select: "name result created createdAt"
    })
    .populate("reportingTo", "name")
    .exec()
    .then((patient) => {
      if (patient) {
        return patient;
      }
      const err = new APIError(
        "No such patient exists",
        httpStatus.NOT_FOUND
      );
      return Promise.reject(err);
    });
},

  /**
   * Find unique email.
   * @param {string} email.
   * @returns {Promise<Patients[]>}
   */
  findUniqueEmail(email) {
    email = email.toLowerCase();
    return this.findOne({
      email: email,
      active: true,
    })
      .populate("listPreferences", "columnOrder")
      .exec()
      .then((patient) => patient);
  },
};

export default mongoose.model("Patients", PatientsSchema);
