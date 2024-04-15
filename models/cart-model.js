const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
        size: {
          type: String,
          default: "M",
        },
        price: {
          type: Number,
          
        }
      },
    ],
    coupon: {
      type: String,
      default: null,
    },
    totalAmount: {
      type: Number,
      
    },
  },
  {
    timestamps: true,
  }
);

const cart = mongoose.model("Cart", cartSchema);

module.exports = cart;