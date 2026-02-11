import express from 'express';
import leaveCtrl from '../controllers/leave.controller';
import asyncHandler from 'express-async-handler';
import authPolicy from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';

const controller = "Leaves";
const router = express.Router();router
  .route("/multiUpdate")
  .all(authPolicy.isAllowed)
  /** POST /api/leaves/leaveId - Delete leave records */
  .post(authorize("Edit", controller), asyncHandler(leaveCtrl.multiupdate));
router
  .route("/multiDelete")
  .all(authPolicy.isAllowed)
  /** POST /api/leaves/leaveId - Delete leave records */
  .post(authorize("Edit", controller), asyncHandler(leaveCtrl.multidelete));
router
  .route("/:leaveId")
  .all(authPolicy.isAllowed)
  /** get /api/leaves/leaveId -  get one leave using id*/
  .get(authorize("View", controller), asyncHandler(leaveCtrl.get));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** get /api/leaves -  get all leaves */
  .get(authorize("View", controller), asyncHandler(leaveCtrl.list));
router.param("leaveId", asyncHandler(leaveCtrl.load));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** POST /api/leaves - Create new leaves */
  .post(authorize("Edit", controller), asyncHandler(leaveCtrl.create));
router
  .route("/:leaveId")
  .all(authPolicy.isAllowed)
  /** get /api/leaves/leaveId -  get one leave using id*/
  .put(authorize("Edit", controller), asyncHandler(leaveCtrl.update));
router
  .route("/:leaveId")
  .all(authPolicy.isAllowed)
  /** get /api/leaves/leaveId -  get one leave using id*/
  .delete(authorize("Edit", controller), asyncHandler(leaveCtrl.remove));


// export default router;
module.exports = router