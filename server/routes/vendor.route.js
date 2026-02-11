import express from 'express';
import vendorCtrl from '../controllers/vendor.controller.js';
import asyncHandler from 'express-async-handler';
import authPolicy from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';

const controller = "Vendors";
const router = express.Router();router
  .route("/multiUpdate")
  .all(authPolicy.isAllowed)
  /** POST /api/vendors/vendorId - Delete vendor records */
  .post(authorize("Edit", controller), asyncHandler(vendorCtrl.multiupdate));
router
  .route("/register")
  /** POST /api/vendors - Register new vendors */
  .post(asyncHandler(vendorCtrl.register));
router
  .route("/multiDelete")
  .all(authPolicy.isAllowed)
  /** POST /api/vendors/vendorId - Delete vendor records */
  .post(authorize("Edit", controller), asyncHandler(vendorCtrl.multidelete));
router
  .route("/:vendorId")
  .all(authPolicy.isAllowed)
  /** get /api/vendors/vendorId -  get one vendor using id*/
  .get(authorize("View", controller), asyncHandler(vendorCtrl.get));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** get /api/vendors -  get all vendors */
  .get(authorize("View", controller), asyncHandler(vendorCtrl.list));
router.param("vendorId", asyncHandler(vendorCtrl.load));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** POST /api/vendors - Create new vendors */
  .post(authorize("Edit", controller), asyncHandler(vendorCtrl.create));
router
  .route("/:vendorId")
  .all(authPolicy.isAllowed)
  /** get /api/vendors/vendorId -  get one vendor using id*/
  .put(authorize("Edit", controller), asyncHandler(vendorCtrl.update));
router
  .route("/:vendorId")
  .all(authPolicy.isAllowed)
  /** get /api/vendors/vendorId -  get one vendor using id*/
  .delete(authorize("Edit", controller), asyncHandler(vendorCtrl.remove));


// export default router;
module.exports = router