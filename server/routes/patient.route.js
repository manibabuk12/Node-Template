import express from 'express';
import patientCtrl from '../controllers/patient.controller';
import asyncHandler from 'express-async-handler';
import authPolicy from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';

const controller = "Patients";
const router = express.Router();router
  .route("/multiUpdate")
  .all(authPolicy.isAllowed)
  /** POST /api/patients/patientId - Delete patient records */
  .post(authorize("Edit", controller), asyncHandler(patientCtrl.multiupdate));
router
  .route("/register")
  /** POST /api/patients - Register new patients */
  .post(asyncHandler(patientCtrl.register));
router
  .route("/multiDelete")
  .all(authPolicy.isAllowed)
  /** POST /api/patients/patientId - Delete patient records */
  .post(authorize("Edit", controller), asyncHandler(patientCtrl.multidelete));
router
  .route("/:patientId")
  .all(authPolicy.isAllowed)
  /** get /api/patients/patientId -  get one patient using id*/
  .get(authorize("View", controller), asyncHandler(patientCtrl.get));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** get /api/patients -  get all patients */
  .get(authorize("View", controller), asyncHandler(patientCtrl.list));
router.param("patientId", asyncHandler(patientCtrl.load));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** POST /api/patients - Create new patients */
  .post(asyncHandler(patientCtrl.create));
router
  .route("/:patientId")
  .all(authPolicy.isAllowed)
  /** get /api/patients/patientId -  get one patient using id*/
  .put(authorize("Edit", controller), asyncHandler(patientCtrl.update));
router
  .route("/:patientId")
  .all(authPolicy.isAllowed)
  /** get /api/patients/patientId -  get one patient using id*/
  .delete(authorize("Edit", controller), asyncHandler(patientCtrl.remove));


// export default router;
module.exports = router