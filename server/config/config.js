import Joi from "joi";

import emailConfig from "./extra/email.config";
import listPreferencesConfig from "./listPreferencesConfig";

let arr = ["development", "production", "test", "provision"];

// define validation for all the env vars
const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string()
    .allow(...arr)
    .default("development"),
  SERVER_PORT: Joi.number().default(4040),
  MONGOOSE_DEBUG: Joi.boolean().when("NODE_ENV", {
    is: Joi.string().equal("development"),
    then: Joi.boolean().default(true),
    otherwise: Joi.boolean().default(false),
  }),
  JWT_SECRET: Joi.string().description("JWT Secret required to sign"),
  MONGO_HOST: Joi.string().description("Mongo DB host url"),
  MONGO_PORT: Joi.number().default(27019),
})
  .unknown()
  .required();

const { error, value: envVars } = envVarsSchema.validate(process.env);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

let config = {
  env: envVars.NODE_ENV,
  port: envVars.SERVER_PORT,
  mongooseDebug: envVars.MONGOOSE_DEBUG,
  jwtSecret: "0a6b944d-d2fb-46fc-a85e-0295c986cd9f",
  mongo: {
    host: envVars.MONGO_HOST,
    port: envVars.MONGO_PORT,
    test: "mongodb://127.0.0.1:27019/goldenfriday",
  },
  projectName: "goldenfriday",
  commonRole: {
    user: "user",
    employee: "employee",
    doctor: "doctor",
    patient:"patient",
    agent:"agent",
    user:"user",
    vendor:"vendor"
  },
  commonStatus: {
    Active: "Active",
    Inactive: "Inactive",
    Pending: "Pending",
    Disabled: "Disabled",
    Suspend: "Suspend",
  },
  emailTemplates: {
    forgetPassword: "forget password",
    registration: "registration",
    register: "register",
    adminForgetPassword: "admin forget password",
    employeeWelcome: "employee welcome",
    userWelcome:"user welcome",
    vendorWelcome:"vendor welcome",
    welcomeUser: "welcome user",
    authenticationUser: "authentication user",
    differentDeviceLoginConfirmation: "different device login confirmation",
    employeeCreate: "employeeCreate",
    vendorCreate: "vendorCreate",
    userCreate:"userCreate",
    agentCreate: "agentCreate",
    doctorCreate: "doctorCreate",
    patientCreate: "patientCreate",
    ActivitiesCreate: "ActivitiesCreate",
    "Email TemplatesCreate": "Email TemplatesCreate",
    RolesCreate: "RolesCreate",
    "Upload HistoryCreate": "Upload HistoryCreate",
    "Email StatusCreate": "Email StatusCreate",
    TicketsCreate: "TicketsCreate",
    projectCreate: "projectCreate",
    taskCreate: "taskCreate",
    partyCreate: "partyCreate",
    constituencyCreate: "constituencyCreate",
    candidateCreate: "candidateCreate",
    voterCreate: "voterCreate",
    electionCreate: "electionCreate",
    voteCreate: "voteCreate",
    leaveCreate: "leaveCreate"
  },
  upload: {
    ...{
      EmployeesDuplicates: "server/upload/EmployeesDuplicates",
      employees: "server/upload/employees",
      vendorsattachment: "server/upload/attachment/vendors",
      VendorsDuplicates: "server/upload/VendorsDuplicates",
      vendors: "server/upload/vendors",
      employeesattachment: "server/upload/attachment/employees",
      UsersDuplicates: "server/upload/UsersDuplicates",
      users: "server/upload/users",
      usersattachment: "server/upload/attachment/users",
      DoctorsDuplicates: "server/upload/DoctorsDuplicates",
      doctors: "server/upload/doctors",
      doctorsattachment: "server/upload/attachment/doctors",
      PatientsDuplicates: "server/upload/PatientsDuplicates",
      patients: "server/upload/patients",
      patientsattachment: "server/upload/attachment/patients",
      AgentsDuplicates: "server/upload/AgentsDuplicates",
      agents: "server/upload/agents",
      agentsattachment: "server/upload/attachment/agents",
      TicketsDuplicates: "server/upload/TicketsDuplicates",
      tickets: "server/upload/tickets",
      ticketsattachment: "server/upload/attachment/tickets",
      ProjectsDuplicates: "server/upload/ProjectsDuplicates",
      projects: "server/upload/projects",
      projectsattachment: "server/upload/attachment/projects",
      TasksDuplicates: "server/upload/TasksDuplicates",
      tasks: "server/upload/tasks",
      tasksattachment: "server/upload/attachment/tasks",
      PartysDuplicates: "server/upload/PartysDuplicates",
      partys: "server/upload/partys",
      partysattachment: "server/upload/attachment/partys",
      ConstituencysDuplicates: "server/upload/ConstituencysDuplicates",
      constituency: "server/upload/constituency",
      constituencysattachment: "server/upload/attachment/constituency",
      CandidatesDuplicates: "server/upload/CandidatesDuplicates",
      candidates: "server/upload/candidates",
      candidatesattachment: "server/upload/attachment/candidates",
      VotersDuplicates: "server/upload/VotersDuplicates",
      voters: "server/upload/voters",
      votersattachment: "server/upload/attachment/voters",
      ElectionsDuplicates: "server/upload/ElectionsDuplicates",
      elections: "server/upload/elections",
      electionsattachment: "server/upload/attachment/elections",
      VotesDuplicates: "server/upload/VotesDuplicates",
      votes: "server/upload/votes",
      votesattachment: "server/upload/attachment/votes",
      LeavesDuplicates: "server/upload/LeavesDuplicates",
      leaves: "server/upload/leaves",
      leavesattachment: "server/upload/attachment/leaves",
    },
    ...{
      user: "server/upload/user",
      employee: "server/upload/employee",
      vendor:"server/upload/vendor",
      user: "server/upload/user",
      doctor:"server/upload/doctor",
      patient:"server/upload/patient",
      agent:"server/upload/agent",
      currency: "server/upload/currency",
      country: "server/upload/country",
      csv: "server/upload/csv",
      attachment: "server/upload/attachment",
      bulkupload: "server/upload/bulkupload",
    },
  },
  // showOrHideFields: {}
  //  showOrHideFields: { user: [{ fieldName: name, employee: true, user: false }] }
  commonDevices: {
    ios: "ios",
    android: "android",
    web: "web",
  },
  limit: 50,
  page: 1,
  sortfield: "created",
  direction: "desc",
  isLoggerValidEnable: false,
  expireTokenTime: 51840000000,
  isTokenNotPassed: false,
  commonOTPAllowed: false,
  commonOTPNumber: 999999,
  viewsExtension: "server/views/",
  isAccessServer: false,
  awsRegion: "us-east-1",
  secret: "secret",
  adminRoomName: "adminRoomUser",
  encryptionStatus: "0", // options '1' for enable, '0' for disable
  fixNum: 8,
  nexmoapiKey: "8a0e4130",
  nexmoapiSecret: "leBt695jb9hrwIcF",
  smsOtpStatus: "enabled", // options 'enabled', 'disabled'
  clientIps: ["127.0.0.1", "167.99.10.87", "::ffff:127.0.0.1", "::1"], // for test purpose
  path: "/var/www/upload",
  serverUrl: "http://localhost:3000/",
  sourceKey: "qVtYv2x5A7CaFcHeMh",
  columnOrder: listPreferencesConfig,
};

config = Object.assign(config, emailConfig);

export default config;
