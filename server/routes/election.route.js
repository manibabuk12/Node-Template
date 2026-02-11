import express from 'express';
import electionCtrl from '../controllers/election.controller';
import asyncHandler from 'express-async-handler';
import authPolicy from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';
import {validateStartElection} from '../middlewares/electionValidation.js'

const controller = "Elections";
const router = express.Router();router
  .route("/multiUpdate")
  .all(authPolicy.isAllowed)
  /** POST /api/elections/electionId - Delete election records */
  .post(authorize("Edit", controller), asyncHandler(electionCtrl.multiupdate));
router
  .route("/multiDelete")
  .all(authPolicy.isAllowed)
  /** POST /api/elections/electionId - Delete election records */
  .post(authorize("Edit", controller), asyncHandler(electionCtrl.multidelete));

  router
  .route("/electionStatusByParty")
  .all(authPolicy.isAllowed)
  /** POST /api/elections/electionId - Delete election records */
  .get(authorize("View", controller), asyncHandler(electionCtrl.electionStatusByParty));
router
  .route("/:electionId")
  .all(authPolicy.isAllowed)
  /** get /api/elections/electionId -  get one election using id*/
  .get(authorize("View", controller), asyncHandler(electionCtrl.get));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** get /api/elections -  get all elections */
  .get(authorize("View", controller), asyncHandler(electionCtrl.list));
router.param("electionId", asyncHandler(electionCtrl.load));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** POST /api/elections - Create new elections */
  .post(authorize("Edit", controller), asyncHandler(electionCtrl.create));
router
  .route("/:electionId")
  .all(authPolicy.isAllowed)
  /** get /api/elections/electionId -  get one election using id*/
  .put(authorize("Edit", controller),validateStartElection,  asyncHandler(electionCtrl.update));
router
  .route("/:electionId")
  .all(authPolicy.isAllowed)
  /** get /api/elections/electionId -  get one election using id*/
  .delete(authorize("Edit", controller), asyncHandler(electionCtrl.remove));


// export default router;
module.exports = router