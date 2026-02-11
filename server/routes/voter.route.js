import express from 'express';
import voterCtrl from '../controllers/voter.controller';
import asyncHandler from 'express-async-handler';
import authPolicy from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';
import {validateRigisterVoter} from '../middlewares/voterValidation.js'

const controller = "Voters";
const router = express.Router();router
  .route("/multiUpdate")
  .all(authPolicy.isAllowed)
  /** POST /api/voters/voterId - Delete voter records */
  .post(authorize("Edit", controller), asyncHandler(voterCtrl.multiupdate));
router
  .route("/multiDelete")
  .all(authPolicy.isAllowed)
  /** POST /api/voters/voterId - Delete voter records */
  .post(authorize("Edit", controller), asyncHandler(voterCtrl.multidelete));
router
  .route("/:voterId")
  .all(authPolicy.isAllowed)
  /** get /api/voters/voterId -  get one voter using id*/
  .get(authorize("View", controller), asyncHandler(voterCtrl.get));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** get /api/voters -  get all voters */
  .get(authorize("View", controller), asyncHandler(voterCtrl.list));
router.param("voterId", asyncHandler(voterCtrl.load));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** POST /api/voters - Create new voters */
  .post(authorize("Edit", controller), validateRigisterVoter, asyncHandler(voterCtrl.create));
router
  .route("/:voterId")
  .all(authPolicy.isAllowed)
  /** get /api/voters/voterId -  get one voter using id*/
  .put(authorize("Edit", controller), asyncHandler(voterCtrl.update));
router
  .route("/:voterId")
  .all(authPolicy.isAllowed)
  /** get /api/voters/voterId -  get one voter using id*/
  .delete(authorize("Edit", controller), asyncHandler(voterCtrl.remove));


// export default router;
module.exports = router