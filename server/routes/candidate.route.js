import express from 'express';
import candidateCtrl from '../controllers/candidate.controller';
import asyncHandler from 'express-async-handler';
import authPolicy from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';
import {validateCreateCandidate} from '../middlewares/candidateValidation.js'

const controller = "Candidate";
const router = express.Router();router
  .route("/multiUpdate")
  .all(authPolicy.isAllowed)
  /** POST /api/candidates/candidateId - Delete candidate records */
  .post(authorize("Edit", controller), asyncHandler(candidateCtrl.multiupdate));
router
  .route("/multiDelete")
  .all(authPolicy.isAllowed)
  /** POST /api/candidates/candidateId - Delete candidate records */
  .post(authorize("Edit", controller), asyncHandler(candidateCtrl.multidelete));
router
  .route("/listCandidatesByParty")
  .all(authPolicy.isAllowed)
  /** get /api/candidates/candidateId -  get one candidate using id*/
  .get(authorize("View", controller), asyncHandler(candidateCtrl.listCandidatesByParty));

  router
  .route("/listCandidatesByConstituency")
  .all(authPolicy.isAllowed)
  /** get /api/candidates/candidateId -  get one candidate using id*/
  .get(authorize("View", controller), asyncHandler(candidateCtrl.listCandidatesByConstituency));

  
  router
  .route("/:candidateId")
  .all(authPolicy.isAllowed)
  /** get /api/candidates/candidateId -  get one candidate using id*/
  .get(authorize("View", controller), asyncHandler(candidateCtrl.get));

router
  .route("/")
  .all(authPolicy.isAllowed)
  /** get /api/candidates -  get all candidates */
  .get(authorize("View", controller), asyncHandler(candidateCtrl.list));
router.param("candidateId", asyncHandler(candidateCtrl.load));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** POST /api/candidates - Create new candidates */
  .post(authorize("Edit", controller), validateCreateCandidate, asyncHandler(candidateCtrl.create));
router
  .route("/:candidateId")
  .all(authPolicy.isAllowed)
  /** get /api/candidates/candidateId -  get one candidate using id*/
  .put(authorize("Edit", controller), asyncHandler(candidateCtrl.update));
router
  .route("/:candidateId")
  .all(authPolicy.isAllowed)
  /** get /api/candidates/candidateId -  get one candidate using id*/
  .delete(authorize("Edit", controller), asyncHandler(candidateCtrl.remove));


// export default router;
module.exports = router