import express from 'express';
import orderCtrl from '../controllers/order.controller';
import asyncHandler from 'express-async-handler';
import authPolicy from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';

const controller = "Orders";
const router = express.Router();router
  .route("/multiUpdate")
  .all(authPolicy.isAllowed)
  /** POST /api/orders/orderId - Delete order records */
  .post(authorize("Edit", controller), asyncHandler(orderCtrl.multiupdate));

  router
  .route("/:orderId")
  .all(authPolicy.isAllowed)
  /** get /api/orders/orderId -  get one order using id*/
  .put(authorize("Edit", controller), asyncHandler(orderCtrl.update));
  
router
  .route("/multiDelete")
  .all(authPolicy.isAllowed)
  /** POST /api/orders/orderId - Delete order records */
  .post(authorize("Edit", controller), asyncHandler(orderCtrl.multidelete));
router
  .route("/:orderId")
  .all(authPolicy.isAllowed)
  /** get /api/orders/orderId -  get one order using id*/
  .get(authorize("View", controller), asyncHandler(orderCtrl.get));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** get /api/orders -  get all orders */
  .get(authorize("View", controller), asyncHandler(orderCtrl.list));
router.param("orderId", asyncHandler(orderCtrl.load));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** POST /api/orders - Create new orders */
  .post(authorize("Edit", controller), asyncHandler(orderCtrl.create));
router
  .route("/:orderId")
  .all(authPolicy.isAllowed)
  /** get /api/orders/orderId -  get one order using id*/
  .put(authorize("Edit", controller), asyncHandler(orderCtrl.update));
router
  .route("/:orderId")
  .all(authPolicy.isAllowed)
  /** get /api/orders/orderId -  get one order using id*/
  .delete(authorize("Edit", controller), asyncHandler(orderCtrl.remove));


// export default router;
module.exports = router