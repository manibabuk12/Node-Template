import express from 'express';
import partyCtrl from '../controllers/party.controller.js';
import asyncHandler from 'express-async-handler';
import authPolicy from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';
import {validateCreateParty} from '../middlewares/partyValidation.js'

const controller = "Partys";
const router = express.Router();router
  .route("/multiUpdate")
  .all(authPolicy.isAllowed)
  /** POST /api/partys/partyId - Delete party records */
  .post(authorize("Edit", controller), asyncHandler(partyCtrl.multiupdate));
router
  .route("/multiDelete")
  .all(authPolicy.isAllowed)
  /** POST /api/partys/partyId - Delete party records */
  .post(authorize("Edit", controller), asyncHandler(partyCtrl.multidelete));
router
  .route("/:partyId")
  .all(authPolicy.isAllowed)
  /** get /api/partys/partyId -  get one party using id*/
  .get(authorize("View", controller), asyncHandler(partyCtrl.get));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** get /api/partys -  get all partys */
  .get(authorize("View", controller),validateCreateParty, asyncHandler(partyCtrl.list));
router
  .route("/")
  /** POST /api/partys - Create new partys */
  .post(authorize("Edit", controller), asyncHandler(partyCtrl.create));

router.param("partyId", asyncHandler(partyCtrl.load));
router
  .route("/:partyId")
  .all(authPolicy.isAllowed)
  /** get /api/partys/partyId -  get one party using id*/
  .put(authorize("Edit", controller), asyncHandler(partyCtrl.update));
router
  .route("/:partyId")
  .all(authPolicy.isAllowed)
  /** get /api/partys/partyId -  get one party using id*/
  .delete(authorize("Edit", controller), asyncHandler(partyCtrl.remove));


// export default router;
module.exports = router