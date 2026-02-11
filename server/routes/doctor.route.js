import express from 'express';
import doctorCtrl from '../controllers/doctor.controller.js';
import asyncHandler from 'express-async-handler';
import authPolicy from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';
 
const controller = "Doctor";
const router = express.Router();
router
.route("/getDoctorsBypatients")
.all(authPolicy.isAllowed)
.get(authorize("View", controller), asyncHandler(doctorCtrl.getDoctorsBypatients));
router
.route("/getReportsByPrescription")
.all(authPolicy.isAllowed)
.get(authorize("View", controller), asyncHandler(doctorCtrl.getReportsByPrescription));
router
.route("/multiUpdate")
.all(authPolicy.isAllowed)
/** POST /api/doctors/doctorId - Delete doctor records */
.post(authorize("Edit", controller), asyncHandler(doctorCtrl.multiupdate));
router
.route("/register")
/** POST /api/doctors - Register new doctors */
.post(asyncHandler(doctorCtrl.register));
router
.route("/multiDelete")
.all(authPolicy.isAllowed)
/** POST /api/doctors/doctorId - Delete doctor records */
.post(authorize("Edit", controller), asyncHandler(doctorCtrl.multidelete));
router
.route("/:doctorId")
.all(authPolicy.isAllowed)
/** get /api/doctors/doctorId - get one doctor using id*/
.get(authorize("View", controller), asyncHandler(doctorCtrl.get));
router
.route("/")
.all(authPolicy.isAllowed)
/** get /api/doctors - get all doctors */
.get(authorize("View", controller), asyncHandler(doctorCtrl.list));
router.param("doctorId", asyncHandler(doctorCtrl.load));
router
.route("/")
.all(authPolicy.isAllowed)
/** POST /api/doctors - Create new doctors */
.post(authorize("Edit", controller), asyncHandler(doctorCtrl.create));
router
.route("/:doctorId")
.all(authPolicy.isAllowed)
/** get /api/doctors/doctorId - get one doctor using id*/
.put(authorize("Edit", controller), asyncHandler(doctorCtrl.update));
router
.route("/:doctorId")
.all(authPolicy.isAllowed)
/** get /api/doctors/doctorId - get one doctor using id*/
.delete(authorize("Edit", controller), asyncHandler(doctorCtrl.remove));
 
// export default router;
module.exports = router