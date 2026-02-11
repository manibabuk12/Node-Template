import express from 'express';
import projectCtrl from '../controllers/project.controller';
import asyncHandler from 'express-async-handler';
import authPolicy from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';

const controller = "Projects";
const router = express.Router();router
  .route("/multiUpdate")
  .all(authPolicy.isAllowed)
  /** POST /api/projects/projectId - Delete project records */
  .post(authorize("Edit", controller), asyncHandler(projectCtrl.multiupdate));
router
  .route("/register")
  /** POST /api/projects - Register new projects */
  .post(asyncHandler(projectCtrl.register));
router
  .route("/multiDelete")
  .all(authPolicy.isAllowed)
  /** POST /api/projects/projectId - Delete project records */
  .post(authorize("Edit", controller), asyncHandler(projectCtrl.multidelete));
router
  .route("/:projectId")
  .all(authPolicy.isAllowed)
  /** get /api/projects/projectId -  get one project using id*/
  .get(authorize("View", controller), asyncHandler(projectCtrl.get));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** get /api/projects -  get all projects */
  .get(authorize("View", controller), asyncHandler(projectCtrl.list));
router.param("projectId", asyncHandler(projectCtrl.load));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** POST /api/projects - Create new projects */
  .post(authorize("Edit", controller), asyncHandler(projectCtrl.create));
router
  .route("/:projectId")
  .all(authPolicy.isAllowed)
  /** get /api/projects/projectId -  get one project using id*/
  .put(authorize("Edit", controller), asyncHandler(projectCtrl.update));
router
  .route("/:projectId")
  .all(authPolicy.isAllowed)
  /** get /api/projects/projectId -  get one project using id*/
  .delete(authorize("Edit", controller), asyncHandler(projectCtrl.remove));


// export default router;
module.exports = router