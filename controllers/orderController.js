const user = require("../models/user-model")
const cartModel = require('../models/cart-model')
const productModel = require('../models/product-model')
const couponModel = require("../models/coupon-model");
const cartHelper = require('../helper/cartHelper')
const orderHelper = require('../helper/orderHelper')
const couponHelper = require('../helper/couponHelper')
const moment = require("moment");
const Razorpay = require("razorpay");

var razorpay = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});


const checkoutPage = async (req, res) => {
  try {
    const userId = req.session.user;
    const userData = await user.findById({ _id: userId })
    let cartItems = await cartHelper.getAllCartItems(userId);
    let cart = await cartModel.findOne({ user: userId });
    const coupons = await couponHelper.findAllCoupons();
    let totalandSubTotal = await cartHelper.totalSubtotal(userId, cartItems);
    if (cart.coupon != null) {
      const appliedCoupon = await couponModel.findOne({ code: cart.coupon });
      cartItems.couponAmount = appliedCoupon.discount;
  
      let totalAmountOfEachProduct = [];
      for (i = 0; i < cartItems.products.length; i++) {
        let total = cartItems.products[i].quantity * parseInt(cartItems.products[i].price);
        totalAmountOfEachProduct.push(total);
      }
      totalandSubTotal = totalandSubTotal;
      console.log(cartItems);
      if (cartItems) {
        res.render("user/checkout", {
          cartItems,
          totalAmountOfEachProduct,
          totalandSubTotal,
          userData,
          coupons,
        });
      }
    } else {
      let totalAmountOfEachProduct = [];
      for (i = 0; i < cartItems.products.length; i++) {
        let total = cartItems.products[i].quantity * parseInt(cartItems.products[i].price);
        totalAmountOfEachProduct.push(total);
      }
      totalandSubTotal = totalandSubTotal;
  
      if (cartItems) {
        res.render("user/checkout", {
          cartItems,
          totalAmountOfEachProduct,
          totalandSubTotal,
          userData,
          coupons,
        });
      }
    }
    
  } catch (error) {
    console.log(error);
  }
}

const placeOrder = async (req, res) => {
  console.log("this is order controller");
  const body = req.body;
  const userId = req.session.user;

  const result = await orderHelper.placeOrder(body, userId);
  if (result.status) {
    const cart = await cartHelper.clearAllCartItems(userId);
    if (cart) {
      res.json({ url: "/orderSuccess", status: true });
    }
  } else {
    res.json({ message: result.message, status: false })
  }
};



const orderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userData = await user.findById({ _id: req.session.user })
    const orderDetails = await orderHelper.getSingleOrderDetails(orderId);
    const productDetails = await orderHelper.getOrderDetailsOfEachProduct(
      orderId
    );
    console.log(productDetails);



    if (orderDetails && productDetails) {
      res.render("user/orderDetails", {
        userData,
        orderDetails,
        productDetails
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const adminOrderPageLoad = async (req, res) => {
  try {
    const allOrders = await orderHelper.getAllOrders();
    for (const order of allOrders) {
      const dateString = order.orderedOn;
      order.formattedDate = moment(dateString).format("MMMM Do, YYYY");
    }

    res.render("admin/admin-orderPage", { allOrders });
  } catch (error) {
    console.log(error);
  }
};

const adminOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;

    const productDetails = await orderHelper.getOrderDetailsOfEachProduct(
      orderId
    );
    const userData = await user.findOne({ _id: productDetails[0].user });
    for (const product of productDetails) {
      const dateString = product.orderedOn;
      product.formattedDate = moment(dateString).format("MMMM Do, YYYY");
      product.formattedTotal = product.totalAmount;
      product.products.formattedProductPrice = product.products.productPrice;
    }

    if (orderDetails && productDetails) {
      res.render("admin/admin-orderDetails", { orderDetails, productDetails, userData });
    }
    console.log(productDetails);
  } catch (error) {
    console.log(error);
  }
};

const changeOrderStatusOfEachProduct = async (req, res) => {
  const orderId = req.params.orderId;
  const productId = req.params.productId;
  const status = req.body.status;
  const result = await orderHelper.changeOrderStatusOfEachProduct(
    orderId,
    productId,
    status,
  );
  if (result) {
    res.json({ status: true });
  } else {
    res.json({ status: false });
  }
};

const cancelSingleOrder = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const singleOrderId = req.query.singleOrderId;
    const price = req.query.price;
    console.log("price:", price)
    const result = await orderHelper.cancelSingleOrder(orderId, singleOrderId, price);
    if (result) {
      res.json({ status: true });
    } else {
      res.json({ status: false });
    }
  } catch (error) {
    console.log(error);
  }
};

const createOrder = async (req, res) => {
  try {
    const amount = req.query.totalAmount;
    console.log("create order :",amount);
    const order = await razorpay.orders.create({
      amount: amount* 100,
      currency: "INR",
      receipt: req.session.user,
    });

    console.log(order);

    res.json({ orderId: order });
  } catch (error) {
    console.log(error);
  }
};

const paymentSuccess = (req, res) => {
  try {
    console.log("this is payment success")
    const { paymentid, signature, orderId } = req.body;
    const { createHmac } = require("node:crypto");
    

    const hash = createHmac("sha256", process.env.KEY_SECRET)
      .update(orderId + "|" + paymentid)
      .digest("hex");
    console.log(signature,hash);

    if (hash === signature) {
      console.log("success");
      res.status(200).json({ success: true, message: "Payment successful" });
    } else {
      console.log("error");
      res.json({ success: false, message: "Invalid payment details" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const orderFailedPageLoad = (req, res) => {
  res.render("user/orderFailure");
};

const orderSuccessPageLoad = (req, res) => {
  res.render("user/orderSuccess");
};

module.exports = {
  checkoutPage,
  placeOrder,
  orderDetails,
  adminOrderPageLoad,
  adminOrderDetails,
  changeOrderStatusOfEachProduct,
  cancelSingleOrder,
  createOrder,
  paymentSuccess,
  orderFailedPageLoad,
  orderSuccessPageLoad
}