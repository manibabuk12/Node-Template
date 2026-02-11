import express from 'express';
import agentCtrl from '../controllers/agent.controller';
import asyncHandler from 'express-async-handler';
import authPolicy from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';

const controller = "Agents";
const router = express.Router();router
  .route("/multiUpdate")
  .all(authPolicy.isAllowed)
  /** POST /api/agents/agentId - Delete agent records */
  .post(authorize("Edit", controller), asyncHandler(agentCtrl.multiupdate));
router
  .route("/register")
  /** POST /api/agents - Register new agents */
  .post(asyncHandler(agentCtrl.register));
router
  .route("/multiDelete")
  .all(authPolicy.isAllowed)
  /** POST /api/agents/agentId - Delete agent records */
  .post(authorize("Edit", controller), asyncHandler(agentCtrl.multidelete));
router
  .route("/:agentId")
  .all(authPolicy.isAllowed)
  /** get /api/agents/agentId -  get one agent using id*/
  .get(authorize("View", controller), asyncHandler(agentCtrl.get));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** get /api/agents -  get all agents */
  .get(authorize("View", controller), asyncHandler(agentCtrl.list));
router.param("agentId", asyncHandler(agentCtrl.load));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** POST /api/agents - Create new agents */
  .post(authorize("Edit", controller), asyncHandler(agentCtrl.create));
router
  .route("/:agentId")
  .all(authPolicy.isAllowed)
  /** get /api/agents/agentId -  get one agent using id*/
  .put(authorize("Edit", controller), asyncHandler(agentCtrl.update));
router
  .route("/:agentId")
  .all(authPolicy.isAllowed)
  /** get /api/agents/agentId -  get one agent using id*/
  .delete(authorize("Edit", controller), asyncHandler(agentCtrl.remove));


// export default router;
module.exports = router