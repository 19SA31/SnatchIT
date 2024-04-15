const couponModel = require("../models/coupon-model");
const cartModel = require("../models/cart-model");
const voucherCode = require("voucher-code-generator");

const ObjectId = require("mongoose").Types.ObjectId;
const moment=require("moment")


const findAllCoupons = () => {
    return new Promise(async (resolve, reject) => {
      await couponModel
        .find()
        .lean()
        .then((result) => {
          resolve(result);
        });
    });
  };

  const addCoupon = (couponData) => {
    return new Promise(async (resolve, reject) => {
     
      const dateString = couponData.couponExpiry;
      // const [day, month, year] = dateString.split(/[-/]/);
  
      // const paddedMonth = month.padStart(2, "0");
      // const paddedDay = day.padStart(2, "0");
  
      // const dateString = new Date(`${year}-${paddedMonth}-${paddedDay}`);
      const date = moment(dateString, 'YYYY-MM-DD');
      const convertedDate = date.toISOString();
  
      let couponCode = voucherCode.generate({
        length: 6,
        count: 1,
        charset: voucherCode.charset("alphabetic"),
      });
  
      const coupon = new couponModel({
        couponName: couponData.couponName,
        code: couponCode[0],
        discount: couponData.couponAmount,
        expiryDate: convertedDate,
      });
  
      await coupon
        .save()
        .then(() => {
          resolve(coupon._id);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }


  const deleteSelectedCoupon = (couponId) => {
    return new Promise(async (resolve, reject) => {
      let result = await couponModel.findOneAndDelete({ _id: couponId });
      resolve(result);
    });
  };


  const getCouponData = (couponId) => {
    return new Promise(async (resolve, reject) => {
      await couponModel
        .findOne({ _id: couponId })
        .lean()
        .then((result) => {
          resolve(result);
        });
    });
  };

  const editCouponDetails = (editedCouponData) => {
    return new Promise(async (resolve, reject) => {
      let coupon = await couponModel.findById({
        _id: editedCouponData.couponId,
      });
      coupon.couponName = editedCouponData.couponName;
      coupon.discount = editedCouponData.couponAmount;
      coupon.expiryDate = editedCouponData.couponExpiry;
  
      await coupon.save();
      resolve(coupon);
    });
  };

  module.exports = {
    findAllCoupons,
    addCoupon,
    deleteSelectedCoupon,
    getCouponData,
    editCouponDetails
  }