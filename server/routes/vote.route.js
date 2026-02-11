import express from 'express';
import voteCtrl from '../controllers/vote.controller.js';
import asyncHandler from 'express-async-handler';
import authPolicy from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';
import {validateVote} from '../middlewares/voteValidation.js'
import voteService from '../services/vote.service.js';

const controller = "Vote";
const router = express.Router()
router
  .route("/getWinner")
  .all(authPolicy.isAllowed)
  /** POST /api/votes/voteId - Delete vote records */
  .get(asyncHandler(voteCtrl.getElectionResult));

  
  router
  .route("/voteAndConstituencyWon")
  .all(authPolicy.isAllowed)
  /** POST /api/votes/voteId - Delete vote records */
  .get(asyncHandler(voteService.voteAndConstituencyWon));

router
  .route("/area")
  .all(authPolicy.isAllowed)
  /** POST /api/votes/voteId - Delete vote records */
  .get(asyncHandler(voteService.areaViseVotes));

router
  .route("/getPartyVotes")
  .all(authPolicy.isAllowed)
  /** POST /api/votes/voteId - Delete vote records */
  .get(asyncHandler(voteCtrl.getVotesByPartys));
  
  router
  .route("/getPercentage")
  .all(authPolicy.isAllowed)
  /** POST /api/votes/voteId - Delete vote records */
  .get(asyncHandler(voteCtrl.getPercentageOfVotes));
  
  

router
  .route("/getAreaWiseVoteDistribution")
  .all(authPolicy.isAllowed)
  .get(authorize("View", controller), asyncHandler(voteCtrl.AreaWiseVoteDistribution));
router
  .route("/getVotesPerParty")
  .all(authPolicy.isAllowed)
  .get(authorize("View", controller), asyncHandler(voteCtrl.winnersList));
router
  .route("/multiUpdate")
  .all(authPolicy.isAllowed)
  /** POST /api/votes/voteId - Delete vote records */
  .post(authorize("Edit", controller), asyncHandler(voteCtrl.multiupdate));
router
  .route("/multiDelete")
  .all(authPolicy.isAllowed)
  /** POST /api/votes/voteId - Delete vote records */
  .post(authorize("Edit", controller), asyncHandler(voteCtrl.multidelete));
router
  .route("/:voteId")
  .all(authPolicy.isAllowed)
  /** get /api/votes/voteId -  get one vote using id*/
  .get(authorize("View", controller), asyncHandler(voteCtrl.get));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** get /api/votes -  get all votes */
  .get(authorize("View", controller), asyncHandler(voteCtrl.list));
router.param("voteId", asyncHandler(voteCtrl.load));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** POST /api/votes - Create new votes */
  .post(authorize("Edit", controller), validateVote, asyncHandler(voteCtrl.create));
router
  .route("/:voteId")
  .all(authPolicy.isAllowed)
  /** get /api/votes/voteId -  get one vote using id*/
  .put(authorize("Edit", controller), asyncHandler(voteCtrl.update));
router
  .route("/:voteId")
  .all(authPolicy.isAllowed)
  /** get /api/votes/voteId -  get one vote using id*/
  .delete(authorize("Edit", controller), asyncHandler(voteCtrl.remove));


// export default router;
module.exports = router