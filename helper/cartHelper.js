const cartModel = require("../models/cart-model");
const productModel = require("../models/product-model");
const ObjectId = require("mongoose").Types.ObjectId;

const getAllCartItems = (userId) => {
    
  return new Promise(async (resolve, reject) => {
    try {

    let userCartItems = await cartModel.findOne({ user: new ObjectId(userId) }).populate('products.productId');

    resolve(userCartItems);
  } catch (error) {
    reject(error);
  }
  });
};

const addToCartHelper = (userId, productId, size) => {
    return new Promise(async (resolve, reject) => {
      const product = await productModel.findOne({ _id: productId });
      const discountedPrice = Math.round(
        product.productPrice -(product.productPrice * product.productDiscount) / 100
      );
      
      const existingCartItem = await cartModel.findOne({
        user: userId,
        "products": {
          $elemMatch: {
            productId: productId,
            "productQuantity.size": size
          }
        }
      });
    
      if(!existingCartItem){
      const cart = await cartModel.updateOne(
        { user: userId },
        {
          $push: {
            products: {
              productId: productId,
              quantity: 1,
              size: size,
              price: discountedPrice,
            },
          },
        },
        { upsert: true }
      );
      console.log(cart);
  
      resolve(cart);}
      else{
        await cartModel.updateOne(
          { user: userId, "products.productId": productId, "products.size": size },
          { $inc: { "products.$.quantity": 1 } }
      );
        resolve(existingCartItem);
      }
    });
  };

  const incDecProductQuantity = (userId, productID, quantity) => {
    return new Promise(async (resolve, reject) => {
      const cart = await cartModel.findOne({ user: userId });


      const product = cart.products.find((items) => {
        return items._id.toString() == productID;
      });
      const originalProductId = product.productId

      const productStock = await productModel.findOne({ _id: originalProductId });
  
      const size = product.size;
      console.log(size);
      const sizeStock = productStock.productQuantity.find((items) => {
        return items.size == size;
      });
      let newQuantity = product.quantity + parseInt(quantity);
  
      if (newQuantity < 1) {
        newQuantity = 1;
      }
      console.log(newQuantity);
      if (newQuantity > sizeStock.quantity) {
        resolve({ status: false, message: "Stock limit exceeded" });
      } else {
        product.quantity = newQuantity;
        await cart.save();
        resolve({
          status: true,
          message: "Quantity updated",
          price: productStock.productPrice,
          discount: productStock.productDiscount,
        });
      }
    });
  };

  const totalSubtotal = (userId, cartItems) => {

    return new Promise(async (resolve, reject) => {
      let cart = await cartModel.findOne({ user: userId });
      let total = 0;
      if (cart) {
          if (cartItems.products.length) {
            for (let i = 0; i < cartItems.products.length; i++) {
              total =total + cartItems.products[i].quantity *parseInt(cartItems.products[i].price);
            }
          } 
          cart.totalAmount = parseFloat(total);
  
          await cart.save();
  
          resolve(total);
       
      } else {
        resolve(total);
      }
    });
  };

  const removeItemFromCart = (userId, productId) => {
    console.log("inside removeitemfromcart",userId,productId);
    return new Promise(async (resolve, reject) => {
      cartModel
        .updateOne(
          { user: userId },
          {
            $pull: { products: { _id: productId } },
            $set: {coupon: null}
          }
        )
        .then((result) => {
          console.log(result);
          resolve(result);
        });
    });
  };

  const clearAllCartItems = (userId) => {
    return new Promise(async (resolve, reject) => {
      const result = await cartModel.deleteOne({ user: userId });
      resolve(result);
    });
  };

  const isAProductInCart = (userId, productId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const cart = await cartModel.findOne({
          user: userId,
          "products.productId": productId,
        });

        if (cart) {
          resolve(cart);
        } else {
          resolve(false);
        }
      } catch (error) {
        console.log(error);
        reject(error);
      }
    });
  };

  const getCartCount = (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await cartModel.findOne({ user: userId });
      if (cart) {
        count = cart.products.length;
      } else {
        count = 0;
      }
      resolve(count);
    });
  };
  

  module.exports = {
    addToCartHelper,
    getAllCartItems,
    totalSubtotal,
    incDecProductQuantity,
    removeItemFromCart,
    clearAllCartItems,
    isAProductInCart,
    getCartCount
  }