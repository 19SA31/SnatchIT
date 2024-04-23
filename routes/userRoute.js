const express = require("express");
const router = express.Router();
const nocache = require('nocache')
const userController = require('../controllers/userController')
const cartController = require('../controllers/cartController')
const productController = require('../controllers/productController')
const orderController = require('../controllers/orderController')
const wishlistController = require('../controllers/wishlistController')
const couponController = require('../controllers/couponController')
const userMiddleware = require("../middlewares/userMiddlewares");
const otpHelper = require('../helper/otpHelper');
 

router.get("/", userController.loadSnatchIt);

router.get("/register",userMiddleware.isLogin,userController.loadRegister)

router.get("/otp-verification",userController.loadOTP)

router.get("/user-productPage/:id",userMiddleware.isLogout,userController.loadUserProduct)

router.get("/login",userMiddleware.isLogin,userController.loginLoad);

router.get("/SnatchIt-Home",userMiddleware.isLogout,userController.loadSnatchIt);

router.get("/logout",userMiddleware.isLogout,userController.logoutUser);

router.get("/user-account",userMiddleware.isLogout,userController.loadAccount);

router.get("/addressEditor/:userId/:addressId",userController.addressEditModal)

router.get("/user-cart",userMiddleware.isLogout,cartController.getCartPage)

router.get("/user-shop",userMiddleware.isLogout,userController.loadShop)

router.get("/checkout",userMiddleware.isLogout,orderController.checkoutPage)

router.get("/orderSuccessPage",userMiddleware.isLogout,orderController.orderSuccessPageLoad)

router.get("/orderDetails/:id",orderController.orderDetails);

router.get("/wishlist", userMiddleware.isLogout, wishlistController.wishListLoad);

router.get("/shopFilter", userMiddleware.isLogout, userController.shopFilterLoad);








router.post("/addToWishlist/:id", wishlistController.addToWishlist);
router.post("/register",otpHelper.sentOtp)
router.post("/resendOTP",otpHelper.resendOtp)
router.post("/otp-verification",userController.insertUserWithVerify)
router.post("/login",userController.checkUser);
router.post("/addToCart/:id/:size", productController.addToCart);
router.post("/placeOrder",orderController.placeOrder)
router.post("/searchProduct", productController.searchProduct);
router.post("/applyCoupon", couponController.applyCoupon);
router.post("/createOrder", orderController.createOrder);


router.patch("/addAddress",userController.addAddress)
router.patch("/updateCartQuantity", cartController.updateCartQuantity);
router.patch("/cancelSingleOrder", orderController.cancelSingleOrder);

router.delete("/removeCart/:id", cartController.removeCartItem);


router.put("/removeFromWishlist", wishlistController.removeFromWishlist);
router.put("/editAddress/:id",userController.editAddress)
router.put("/updateUser",userController.updateUser)
router.put("/deleteAddress/:id",userController.deleteAddress)
router.put("/updatePassword",userController.updatePassword)





module.exports = router
