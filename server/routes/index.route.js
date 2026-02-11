import express from "express";

const router = express.Router(); // eslint-disable-line new-cap

/** GET /health-check - Check service health */
router.get("/health-check", (req, res) => res.send("OK"));

import bulkuploadStatusRoutes from "./bulkuploadStatus.route.js";
// mount uploads routes at /uploads
router.use("/bulkuploadStatus", bulkuploadStatusRoutes);

import authRoutes from "./auth.route";
// mount auth routes at /auth
router.use("/auth", authRoutes);

import roleRoutes from "./role.route";
// mount auth routes at /auth
router.use("/roles", roleRoutes);

const menulistRoutes = require("./menulist.route");
// mount menulists routes at menulists
router.use("/menus", menulistRoutes);

import settingsRoutes from "./settings.route";
// mount settings routes at /settings
router.use("/settings", settingsRoutes);

import templateRoutes from "./templates.route";
// mount templates routes at /templates
router.use("/templates", templateRoutes);

import uploadRoutes from "./upload.route";
// mount uploads routes at /uploads
router.use("/uploads", uploadRoutes);

import activityRoutes from "./activity.route";
// mount activity routes at /activities
router.use("/activities", activityRoutes);

import emailStatusRoutes from "./emailstatus.route";
// mount emailStatus routes at /uploads
router.use("/emailStatus", emailStatusRoutes);

const listPreferences = require("./listPreferences.route.js");
router.use("/listPreferences", listPreferences);

const tableView = require("./tableView.route.js");
router.use("/tableView", tableView);

const exportToCsvViews = require("./exportToCsvViews.route.js");
router.use("/exportToCsvViews", exportToCsvViews);

const configuration = require("./configuration.route.js");
router.use("/configuration", configuration);

const configurationScreens = require("./configureScreens.route.js");
router.use("/fieldConfigurationScreen", configurationScreens);

const formView = require("./formView.route.js");
router.use("/formViews", formView);

const versionsRoutes = require("./versions.route.js");
router.use("/versions", versionsRoutes);5

const tickets = require("./ticket.route.js");
router.use("/tickets", tickets);

const filterRoute = require("./filters.route.js");
router.use("/filters", filterRoute);

const employeeRoutes = require("./employee.route");
// mount employee routes at /employees
router.use("/employees", employeeRoutes);

const agentRoutes = require("./agent.route.js");
// mount agents routes at /agents
router.use("/agents", agentRoutes);

const partyRoutes = require("./party.route.js");
// mount agents routes at /party
router.use("/party", partyRoutes);

const candidateRoutes = require("./candidate.route.js");
// mount agents routes at /party
router.use("/candidate", candidateRoutes);

const voterRoutes = require("./voter.route.js");
// mount agents routes at /party
router.use("/voter", voterRoutes);

const voteRoutes = require("./vote.route.js");
// mount agents routes at /party
router.use("/vote", voteRoutes);

const constituencyRoutes = require("./constituency.route.js");
// mount agents routes at /agents
router.use("/constituencys", constituencyRoutes);

const electionRoutes = require("./election.route.js");
// mount agents routes at /agents
router.use("/election", electionRoutes);

const hospitalRoutes = require("./hospital.route.js");
// mount employee routes at /employees
router.use("/hospitals", hospitalRoutes);

const doctorRoutes = require("./doctor.route.js");
// mount employee routes at /employees
router.use("/doctors", doctorRoutes);

const vendorRoute = require("./vendor.route.js");
// mount employee routes at /employees
router.use("/vendors", vendorRoute);

const patientRoutes = require("./patient.route.js");
// mount employee routes at /employees
router.use("/patients", patientRoutes);

const prescriptionRoutes = require("./prescription.route.js");
// mount employee routes at /employees
router.use("/prescriptions", prescriptionRoutes);

const projectRoutes = require("./project.route");
// mount project routes at /projects
router.use("/projects", projectRoutes);

const taskRoutes = require("./task.route");
// mount task routes at /tasks
router.use("/tasks", taskRoutes);

const leaveRoutes = require("./leave.route");
// mount leave routes at /leaves
router.use("/leaves", leaveRoutes);

const reportRoutes = require("./report.route.js");
// mount employee routes at /employees
router.use("/reports", reportRoutes);


export default router;
