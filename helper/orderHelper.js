const cartModel = require("../models/cart-model");
const userModel = require('../models/user-model');
const productModel = require("../models/product-model");
const orderModel = require("../models/order-model");
const walletHelper = require("../helper/walletHelper");
const ObjectId = require("mongoose").Types.ObjectId;



const placeOrder = (body, userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const cart = await cartModel.findOne({ user: userId });
        const address = await userModel.findOne(
          { _id: userId, "address._id": body.addressId },
          {
            "address.$": 1,
            _id: 0,
          }
        );
        console.log(address);
        const user = await userModel.findOne({ _id: userId });
        console.log(cart);
        let products = [];
        let status = "pending";
        if (body.status) {
          status = "payment pending";
        }
        for (const product of cart.products) {
          products.push({
            product: product.productId,
            quantity: product.quantity,
            size: product.size,
            productPrice: product.price,
            status: status,
          });
  
          
  
          let changeStock = await productModel.updateOne(
            { _id: product.productId, "productQuantity.size": product.size },
            {
              $inc: {
                "productQuantity.$.quantity": -product.quantity,
                totalQuantity: -product.quantity,
              },
            }
          );
        }

  
        if (cart && address) {
          const result = orderModel.create({
            user: userId,
            products: products,
            address: {
              name: user.name,
              house: address.address[0].housename,
              street: address.address[0].streetname,
              area: address.address[0].areaname,
              district: address.address[0].districtname,
              state: address.address[0].statename,
              country: address.address[0].countryname,
              pin: address.address[0].pin,
              phone: user.phone,
            },
            paymentMethod: body.paymentOption,
            totalAmount: cart.totalAmount,
          });
  
          resolve({ result: result, status: true });
        }
      } catch (error) {
        console.log(error);
      }
    });
  };

  const getOrderDetails = (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const orderDetails = await orderModel
          .find({ user: userId })
          .sort({ orderedOn: -1 });
  
        resolve(orderDetails);
      } catch (error) {
        console.log(error);
      }
    });
  };

  const getSingleOrderDetails = (orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const singleOrderDetails = await orderModel.aggregate([
          {
            $match: {
              _id: new ObjectId(orderId),
            },
          },
          {
            $project: {
              user: 1,
              totalAmount: 1,
              paymentMethod: 1,
              orderedOn: 1,
              status: 1,
            },
          },
        ]);
        console.log(singleOrderDetails);
        resolve(singleOrderDetails);
      } catch (error) {
        console.log(error);
      }
    });
  };

  const getOrderDetailsOfEachProduct = (orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const orderDetails = await orderModel.aggregate([
          {
            $match: {
              _id: new ObjectId(orderId),
            },
          },
          {
            $unwind: "$products",
          },
          {
            $lookup: {
              from: "products",
              localField: "products.product",
              foreignField: "_id",
              as: "orderedProduct",
            },
          },
          {
            $unwind: "$orderedProduct",
          },
        ]);
        let check = true;
        let count = 0;
  
        for (const order of orderDetails) {
          if (order.products.status == "delivered") {
            check = true;
            count++;
          } else if (order.products.status == "cancelled") {
            check = true;
          } else {
            check = false;
            break;
          }
        }
        if (check == true && count >= 1) {
          orderDetails.deliveryStatus = true;
        }
        console.log(orderDetails);
  
        resolve(orderDetails);
      } catch (error) {
        console.log(error);
      }
    });
  };

  const getAllOrders = () => {
    return new Promise(async (resolve, reject) => {
      const result = await orderModel
        .aggregate([
          {
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "userOrderDetails",
            },
          },
        ])
        .sort({ orderedOn: -1 });
      if (result) {
        resolve(result);
      }
    });
  };

  const changeOrderStatusOfEachProduct = (orderId, productId, status) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await orderModel.findOneAndUpdate(
          { _id: new ObjectId(orderId), "products._id": new ObjectId(productId) },
          {
            $set: { "products.$.status": status },
          },
          { new: true }
        );
        console.log(result);
        resolve(result);
      } catch (error) {
        console.log(error);
      }
    });
  };

  

  const salesReport = async () => {
    try {
      const result = await orderModel.aggregate([
        { $unwind: "$products" },
        { $match: { "products.status": "delivered" } },
        {
          $lookup: {
            from: "products",
            localField: "products.product",
            foreignField: "_id",
            as: "productDetails",
          },
        },
      ]);
  
      return result;
    } catch (error) {
      console.log("Error:", error);
      throw error; // Re-throwing the error to be caught elsewhere if needed.
    }
  };
  
  const salesReportDateSort = async (startDate, endDate) => {
    try {
      const startDateSort = new Date(startDate);
      const endDateSort = new Date(endDate);
  
      const result = await orderModel.aggregate([
        {
          $match: {
            orderedOn: { $gte: startDateSort, $lte: endDateSort },
          },
        },
        { $unwind: "$products" },
        { $match: { "products.status": "delivered" } },
        {
          $lookup: {
            from: "products",
            localField: "products.product",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        { $sort: { orderedOn: 1 } }, // 1 for ascending order, -1 for descending
      ]);
      console.log(result);
      return result;
    } catch (error) {
      console.log("Error:", error);
      throw error; // Re-throwing the error to be caught elsewhere if needed.
    }
  };

  const cancelSingleOrder = (orderId, singleOrderId, price) => {
    console.log("enterd in to cancel single order");
    return new Promise(async (resolve, reject) => {
      try {
        const cancelled = await orderModel.findOneAndUpdate(
          {
            _id: new ObjectId(orderId),
            "products._id": new ObjectId(singleOrderId),
          },
          {
            $set: { "products.$.status": "cancelled" },
          },
          {
            new: true,
          }
        );
        const result = await orderModel.aggregate([
          {
            $unwind: "$products",
          },
          {
            $match: {
              _id: new ObjectId(orderId),
              "products._id": new ObjectId(singleOrderId),
            },
          },
        ]);
        const singleProductId = result[0].products.product;
        const singleProductSize = result[0].products.size;
        const singleProductQuantity = result[0].products.quantity;
  
        const stockIncrease = await productModel.updateOne(
          { _id: singleProductId, "productQuantity.size": singleProductSize },
          {
            $inc: {
              "productQuantity.$.quantity": singleProductQuantity,
              totalQuantity: singleProductQuantity,
            },
          }
        );
        const response = await orderModel.findOne({ _id: orderId });
        console.log("order id is",orderId)
        console.log("response issssssssssss",response.paymentMethod)
        if (response.paymentMethod == 'RazorPay') {
          console.log("razorpay");
          const walletUpdation = await walletHelper.walletAmountAdding(
            response.user,
            price
          );
        }
  
        resolve(cancelled);
      } catch (error) {
        console.log(error);
      
      }
    });
  };
  
  

  module.exports={
    placeOrder,
    getOrderDetails,
    getSingleOrderDetails,
    getOrderDetailsOfEachProduct,
    getAllOrders,
    changeOrderStatusOfEachProduct,
    salesReport,
    salesReportDateSort,
    cancelSingleOrder
  }