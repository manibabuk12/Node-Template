import express from 'express';
import hospitalCtrl from '../controllers/hospital.controller';
import asyncHandler from 'express-async-handler';
import authPolicy from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';

const controller = "Hospital";
const router = express.Router();router
  .route("/multiUpdate")
  .all(authPolicy.isAllowed)
  /** POST /api/hospitals/hospitalId - Delete hospital records */
  .post(authorize("Edit", controller), asyncHandler(hospitalCtrl.multiupdate));
router
  .route("/multiDelete")
  .all(authPolicy.isAllowed)
  /** POST /api/hospitals/hospitalId - Delete hospital records */
  .post(authorize("Edit", controller), asyncHandler(hospitalCtrl.multidelete));
router
  .route("/:hospitalId")
  .all(authPolicy.isAllowed)
  /** get /api/hospitals/hospitalId -  get one hospital using id*/
  .get(authorize("View", controller), asyncHandler(hospitalCtrl.get));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** get /api/hospitals -  get all hospitals */
  .get(authorize("View", controller), asyncHandler(hospitalCtrl.list));
router.param("hospitalId", asyncHandler(hospitalCtrl.load));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** POST /api/hospitals - Create new hospitals */
  .post(authorize("Edit", controller), asyncHandler(hospitalCtrl.create));
router
  .route("/:hospitalId")
  .all(authPolicy.isAllowed)
  /** get /api/hospitals/hospitalId -  get one hospital using id*/
  .put(authorize("Edit", controller), asyncHandler(hospitalCtrl.update));
router
  .route("/:hospitalId")
  .all(authPolicy.isAllowed)
  /** get /api/hospitals/hospitalId -  get one hospital using id*/
  .delete(authorize("Edit", controller), asyncHandler(hospitalCtrl.remove));


// export default router;
module.exports = router