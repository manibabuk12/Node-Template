import express from 'express';
import userCtrl from '../controllers/user.controller';
import asyncHandler from 'express-async-handler';
import authPolicy from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';

const controller = "Users";
const router = express.Router();


  router
  .route("/updateWishList")
  .all(authPolicy.isAllowed)
  /** POST /api/users/userId - Delete user records */
  .post(authorize("Edit", controller), asyncHandler(userCtrl.updateWishlist));


  router
  .route("/getWishList")
  .all(authPolicy.isAllowed)
  /** Get /api/users/userId - Get user WishList */
  .get(authorize("View", controller), asyncHandler(userCtrl.getWishlist));


  router
  .route("/rolebasedOrders")
  .all(authPolicy.isAllowed)
  /** POST /api/users/userId - Delete user records */
  .get(authorize("View", controller), asyncHandler(userCtrl.roleBasedOrdersProductsReviews));


router
  .route("/multiUpdate")
  .all(authPolicy.isAllowed)
  /** POST /api/users/userId - Delete user records */
  .post(authorize("Edit", controller), asyncHandler(userCtrl.multiupdate));
router
  .route("/register")
  /** POST /api/users - Register new users */
  .post(asyncHandler(userCtrl.register));
router
  .route("/multiDelete")
  .all(authPolicy.isAllowed)
  /** POST /api/users/userId - Delete user records */
  .post(authorize("Edit", controller), asyncHandler(userCtrl.multidelete));
router
  .route("/:userId")
  .all(authPolicy.isAllowed)
  /** get /api/users/userId -  get one user using id*/
  .get(authorize("View", controller), asyncHandler(userCtrl.get));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** get /api/users -  get all users */
  .get(authorize("View", controller), asyncHandler(userCtrl.list));
router.param("userId", asyncHandler(userCtrl.load));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** POST /api/users - Create new users */
  .post(authorize("Edit", controller), asyncHandler(userCtrl.create));
router
  .route("/:userId")
  .all(authPolicy.isAllowed)
  /** get /api/users/userId -  get one user using id*/
  .put(authorize("Edit", controller), asyncHandler(userCtrl.update));
router
  .route("/:userId")
  .all(authPolicy.isAllowed)
  /** get /api/users/userId -  get one user using id*/
  .delete(authorize("Edit", controller), asyncHandler(userCtrl.remove));


// export default router;
module.exports = router