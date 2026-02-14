import express from 'express';
import reviewCtrl from '../controllers/review.controller';
import asyncHandler from 'express-async-handler';
import authPolicy from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';

const controller = "Reviews";
const router = express.Router();router
  .route("/multiUpdate")
  .all(authPolicy.isAllowed)
  /** POST /api/reviews/reviewId - Delete review records */
  .post(authorize("Edit", controller), asyncHandler(reviewCtrl.multiupdate));
router
  .route("/multiDelete")
  .all(authPolicy.isAllowed)
  /** POST /api/reviews/reviewId - Delete review records */
  .post(authorize("Edit", controller), asyncHandler(reviewCtrl.multidelete));
router
  .route("/:reviewId")
  .all(authPolicy.isAllowed)
  /** get /api/reviews/reviewId -  get one review using id*/
  .get(authorize("View", controller), asyncHandler(reviewCtrl.get));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** get /api/reviews -  get all reviews */
  .get(authorize("View", controller), asyncHandler(reviewCtrl.list));
router.param("reviewId", asyncHandler(reviewCtrl.load));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** POST /api/reviews - Create new reviews */
  .post(authorize("Edit", controller), asyncHandler(reviewCtrl.create));
router
  .route("/:reviewId")
  .all(authPolicy.isAllowed)
  /** get /api/reviews/reviewId -  get one review using id*/
  .put(authorize("Edit", controller), asyncHandler(reviewCtrl.update));
router
  .route("/:reviewId")
  .all(authPolicy.isAllowed)
  /** get /api/reviews/reviewId -  get one review using id*/
  .delete(authorize("Edit", controller), asyncHandler(reviewCtrl.remove));


// export default router;
module.exports = router