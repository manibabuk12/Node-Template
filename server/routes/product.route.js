import express from 'express';
import productCtrl from '../controllers/product.controller';
import asyncHandler from 'express-async-handler';
import authPolicy from '../middlewares/authenticate';
import authorize from '../middlewares/authorize';

const controller = "Products";
const router = express.Router();router
  .route("/multiUpdate")
  .all(authPolicy.isAllowed)
  /** POST /api/products/productId - Delete product records */
  .post(authorize("Edit", controller), asyncHandler(productCtrl.multiupdate));
router
  .route("/multiDelete")
  .all(authPolicy.isAllowed)
  /** POST /api/products/productId - Delete product records */
  .post(authorize("Edit", controller), asyncHandler(productCtrl.multidelete));
router
  .route("/:productId")
  .all(authPolicy.isAllowed)
  /** get /api/products/productId -  get one product using id*/
  .get(authorize("View", controller), asyncHandler(productCtrl.get));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** get /api/products -  get all products */
  .get(authorize("View", controller), asyncHandler(productCtrl.list));
router.param("productId", asyncHandler(productCtrl.load));
router
  .route("/")
  .all(authPolicy.isAllowed)
  /** POST /api/products - Create new products */
  .post(authorize("Edit", controller), asyncHandler(productCtrl.create));
router
  .route("/:productId")
  .all(authPolicy.isAllowed)
  /** get /api/products/productId -  get one product using id*/
  .put(authorize("Edit", controller), asyncHandler(productCtrl.update));
router
  .route("/:productId")
  .all(authPolicy.isAllowed)
  /** get /api/products/productId -  get one product using id*/
  .delete(authorize("Edit", controller), asyncHandler(productCtrl.remove));


// export default router;
module.exports = router