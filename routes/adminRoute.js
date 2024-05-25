const express = require('express')
const router = express.Router()
const nocache = require('nocache')
const adminController = require('../controllers/adminController')
const orderController = require('../controllers/orderController')
const couponController = require('../controllers/couponController')
const offerController = require('../controllers/offerController')
const categoryHelper = require('../helper/categoryHelper')
const productHelper = require('../helper/productHelper')
const multer = require("../middlewares/multer");
const adminMiddleware = require("../middlewares/adminMiddlewares");




router.get("/admin-login",adminMiddleware.isLoginAdmin,adminController.adminLogin);
router.get("/admin-dashboard",adminMiddleware.isLogoutAdmin,adminController.loadDashboard);
router.get("/admin-products",adminMiddleware.isLogoutAdmin,adminController.adminProducts);
router.get("/admin-userEdit",adminMiddleware.isLogoutAdmin,adminController.adminUserEdit);
router.get("/admin-category",adminMiddleware.isLogoutAdmin,adminController.adminCatListUnlist);
router.get("/admin-catEditor/:id",adminMiddleware.isLogoutAdmin,categoryHelper.modalLoader)
router.get("/admin-addproduct",adminMiddleware.isLogoutAdmin,adminController.loadAddProduct)
router.get("/admin-editProduct/:id",adminMiddleware.isLogoutAdmin,adminController.editProductLoad);
router.get("/logoutAdmin",adminMiddleware.isLogoutAdmin,adminController.logoutAdmin)
router.get("/admin-orderPage",orderController.adminOrderPageLoad)
router.get("/admin-orderDetails/:id", orderController.adminOrderDetails);
router.get("/admin-coupon",adminMiddleware.isLogoutAdmin,couponController.couponLoad)
router.get(
    "/editCoupon/:id",adminMiddleware.isLogoutAdmin,
    couponController.getEditCoupon
  );
router.get(
    "/admin-categoryOffer",
    adminMiddleware.isLogoutAdmin,
    offerController.categoryOfferLoad
  );
router.get("/categoryEditOffer/:id", adminMiddleware.isLogoutAdmin, offerController.categoryEditLoad);
router.get("/salesReport", orderController.loadSalesReport);



router.post("/admin-login",adminMiddleware.isLoginAdmin,adminController.checkAdmin);
router.post("/addProduct",multer.productUpload.array("images"),adminController.addProduct);
router.post("/addCoupon", couponController.addCoupon);
router.post("/editCoupon", couponController.editCoupon);
router.post("/categoryAddOffer", offerController.addCategoryOffer);
router.post("/categoryEditOffer", offerController.categoryEditOffer);
router.post("/salesReport", orderController.loadSalesReportDateSort);


router.delete("/deleteCoupon/:id", couponController.deleteCoupon);





router.put("/editProduct/:id",multer.productUpload.array("images"),productHelper.editProductPost);
router.put("/addCategory",adminController.addCategory);




router.patch("/editcategory",categoryHelper.editedSave);
router.patch("/blockUnblockUser/:id",adminController.userBlockUnblock);
router.patch("/listUnlist",adminController.listUnlist);
router.patch("/deleteProduct/:id", adminController.softDeleteProduct);
router.patch("/orderStatusChangeForEachProduct/:orderId/:productId",
    orderController.changeOrderStatusOfEachProduct
);
router.patch("/deleteImage/:id/:image",adminController.deleteImage);
router.patch("/listUnlistCategoryOffer/:id", offerController.listUnlistOfferCategory);



module.exports = router
