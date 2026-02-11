import express from 'express';
import constituencyCtrl from '../controllers/constituency.controller.js';
import asyncHandler from 'express-async-handler';
import authPolicy from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';

const controller = "Constituency";
const router = express.Router();router
  .route("/multiUpdate")
  .all(authPolicy.isAllowed)
  /** POST /api/constituencys/constituencyId - Delete constituency records */
  .post(authorize("Edit", controller), asyncHandler(constituencyCtrl.multiupdate));
router
  .route("/multiDelete")
  .all(authPolicy.isAllowed)
  /** POST /api/constituencys/constituencyId - Delete constituency records */
  .post(authorize("Edit", controller), asyncHandler(constituencyCtrl.multidelete));
router
  .route("/:constituencyId")
  .all(authPolicy.isAllowed)
  /** get /api/constituencys/constituencyId -  get one constituency using id*/
  .get(authorize("View", controller), asyncHandler(constituencyCtrl.get));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** get /api/constituencys -  get all constituencys */
  .get(authorize("View", controller), asyncHandler(constituencyCtrl.list));
router.param("constituencyId", asyncHandler(constituencyCtrl.load));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** POST /api/constituencys - Create new constituencys */
  .post(authorize("Edit", controller), asyncHandler(constituencyCtrl.create));
router
  .route("/:constituencyId")
  .all(authPolicy.isAllowed)
  /** get /api/constituencys/constituencyId -  get one constituency using id*/
  .put(authorize("Edit", controller), asyncHandler(constituencyCtrl.update));
router
  .route("/:constituencyId")
  .all(authPolicy.isAllowed)
  /** get /api/constituencys/constituencyId -  get one constituency using id*/
  .delete(authorize("Edit", controller), asyncHandler(constituencyCtrl.remove));


// export default router;
module.exports = router