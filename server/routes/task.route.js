import express from 'express';
import taskCtrl from '../controllers/task.controller';
import asyncHandler from 'express-async-handler';
import authPolicy from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';

const controller = "Tasks";
const router = express.Router();router
  .route("/multiUpdate")
  .all(authPolicy.isAllowed)
  /** POST /api/tasks/taskId - Delete task records */
  .post(authorize("Edit", controller), asyncHandler(taskCtrl.multiupdate));
router
  .route("/multiDelete")
  .all(authPolicy.isAllowed)
  /** POST /api/tasks/taskId - Delete task records */
  .post(authorize("Edit", controller), asyncHandler(taskCtrl.multidelete));
router
  .route("/:taskId")
  .all(authPolicy.isAllowed)
  /** get /api/tasks/taskId -  get one task using id*/
  .get(authorize("View", controller), asyncHandler(taskCtrl.get));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** get /api/tasks -  get all tasks */
  .get(authorize("View", controller), asyncHandler(taskCtrl.list));
router.param("taskId", asyncHandler(taskCtrl.load));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** POST /api/tasks - Create new tasks */
  .post(authorize("Edit", controller), asyncHandler(taskCtrl.create));
router
  .route("/:taskId")
  .all(authPolicy.isAllowed)
  /** get /api/tasks/taskId -  get one task using id*/
  .put(authorize("Edit", controller), asyncHandler(taskCtrl.update));
router
  .route("/:taskId")
  .all(authPolicy.isAllowed)
  /** get /api/tasks/taskId -  get one task using id*/
  .delete(authorize("Edit", controller), asyncHandler(taskCtrl.remove));


// export default router;
module.exports = router