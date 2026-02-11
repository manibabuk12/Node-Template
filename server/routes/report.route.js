import express from 'express';
import reportCtrl from '../controllers/report.controller';
import asyncHandler from 'express-async-handler';
import authPolicy from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';

const controller = "Reports";
const router = express.Router();router
  .route("/multiUpdate")
  .all(authPolicy.isAllowed)
  /** POST /api/reports/reportId - Delete report records */
  .post(authorize("Edit", controller), asyncHandler(reportCtrl.multiupdate));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** POST /api/reports - Create new reports */
  .post(authorize("Edit", controller), asyncHandler(reportCtrl.create));

router
  .route("/multiDelete")
  .all(authPolicy.isAllowed)
  /** POST /api/reports/reportId - Delete report records */
  .post(authorize("Edit", controller), asyncHandler(reportCtrl.multidelete));
router
  .route("/:reportId")
  .all(authPolicy.isAllowed)
  /** get /api/reports/reportId -  get one report using id*/
  .get(authorize("View", controller), asyncHandler(reportCtrl.get));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** get /api/reports -  get all reports */
  .get(authorize("View", controller), asyncHandler(reportCtrl.list));
router
  .route("/:reportId")
  .all(authPolicy.isAllowed)
  /** get /api/reports/reportId -  get one report using id*/
  .put(authorize("Edit", controller), asyncHandler(reportCtrl.update));
router
  .route("/:reportId")
  .all(authPolicy.isAllowed)
  /** get /api/reports/reportId -  get one report using id*/
  .delete(authorize("Edit", controller), asyncHandler(reportCtrl.remove));
router.param("reportId", asyncHandler(reportCtrl.load));



// export default router;
module.exports = router