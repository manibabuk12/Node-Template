import express from 'express';
import prescriptionCtrl from '../controllers/prescription.controller';
import asyncHandler from 'express-async-handler';
import authPolicy from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';

const controller = "Prescriptions";
const router = express.Router();router
  .route("/multiUpdate")
  .all(authPolicy.isAllowed)
  /** POST /api/prescriptions/prescriptionId - Delete prescription records */
  .post(authorize("Edit", controller), asyncHandler(prescriptionCtrl.multiupdate));
router
  .route("/multiDelete")
  .all(authPolicy.isAllowed)
  /** POST /api/prescriptions/prescriptionId - Delete prescription records */
  .post(authorize("Edit", controller), asyncHandler(prescriptionCtrl.multidelete));
router
  .route("/:prescriptionId")
  .all(authPolicy.isAllowed)
  /** get /api/prescriptions/prescriptionId -  get one prescription using id*/
  .get(authorize("View", controller), asyncHandler(prescriptionCtrl.get));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** get /api/prescriptions -  get all prescriptions */
  .get(authorize("View", controller), asyncHandler(prescriptionCtrl.list));
router.param("prescriptionId", asyncHandler(prescriptionCtrl.load));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** POST /api/prescriptions - Create new prescriptions */
  .post(authorize("Edit", controller), asyncHandler(prescriptionCtrl.create));
router
  .route("/:prescriptionId")
  .all(authPolicy.isAllowed)
  /** get /api/prescriptions/prescriptionId -  get one prescription using id*/
  .put(authorize("Edit", controller), asyncHandler(prescriptionCtrl.update));
router
  .route("/:prescriptionId")
  .all(authPolicy.isAllowed)
  /** get /api/prescriptions/prescriptionId -  get one prescription using id*/
  .delete(authorize("Edit", controller), asyncHandler(prescriptionCtrl.remove));


// export default router;
module.exports = router