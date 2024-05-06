const user = require("../models/user-model")
const cartModel = require('../models/cart-model')
const productModel = require('../models/product-model')
const offerModel = require('../models/offer-model')
const cartHelper = require('../helper/cartHelper')
const ObjectId = require("mongoose").Types.ObjectId;

const getCartPage = async(req,res)=>{

    try {
        const userData=req.session.user

        const cartItems= await cartHelper.getAllCartItems(userData)
        const productDiscounts = [];
        const categoryDiscounts = [];

        if(cartItems){
            if(cartItems.products.length){
      
            let totalAmountOfEachProduct = [];
            for (i = 0; i < cartItems.products.length; i++) {
              const productId = cartItems.products[i].productId;

              // Get productDiscount for the current product
              const product = await productModel.findById(productId);
              const productDiscount = product ? product.productDiscount : 0;
              productDiscounts.push(productDiscount);

              const productCategory = product ? product.productCategory : null;

              // Get categoryDiscount for the current product category
              const category = await offerModel.findOne({ category: productCategory });
              const categoryDiscount = category ? category.discount : 0;
              categoryDiscounts.push(categoryDiscount);


              let total = cartItems.products[i].quantity * parseInt(cartItems.products[i].price);
              totalAmountOfEachProduct.push(total); 
            }
            const maximumDiscounts = [];
            for (let i = 0; i < productDiscounts.length; i++) {
                const maximumDiscount = Math.max(productDiscounts[i], categoryDiscounts[i]);
                maximumDiscounts.push(maximumDiscount);
            }

            let totalandSubTotal = await cartHelper.totalSubtotal(userData, cartItems);
              res.render('user/user-cart',
              { cartItems: cartItems ,
              totalAmount: totalandSubTotal,
              totalAmountOfEachProduct,
              maximumDiscounts,
              status : true
              
              });
            }else{
              res.render('user/user-cart',{
                status : false
              })
            }
          } else{
            res.render('user/user-cart',{
              status : false
            })
          } 
      
    } catch (error) {
        console.log(error);
    }
}

const updateCartQuantity = async (req, res) => {
    const productId = req.query.productId;
    const quantity = req.query.quantity;
    const userId = req.session.user;
    const product = await productModel.findOne({ _id: productId }).lean();
    const update = await cartHelper.incDecProductQuantity(
      userId,
      productId,
      quantity
    );
    
    const cartItems = await cartHelper.getAllCartItems(userId);

  
    if (update.status) {
      const cart = await cartModel.aggregate([
        { $unwind: "$products" },
        {
          $match: {
            user: new ObjectId(userId),
            "products._id": new ObjectId(productId),
          },
        },
      ]);



      console.log("This is cart",cart);

  
      const totalSubtotal = await cartHelper.totalSubtotal(userId, cartItems);
      console.log(totalSubtotal);
      

      let totalAmountOfEachProduct = [];
      console.log("sdafkasdf",cartItems.products.length);
      for (i = 0; i < cartItems.products.length; i++) {
        let total =
          cartItems.products[i].quantity * parseInt(cartItems.products[i].price);
      
        totalAmountOfEachProduct.push(total);
      }
      console.log(totalAmountOfEachProduct);
  
      res.json({
        status: true,
        message: update.message,
        cartDetails: cart,
        totalSubtotal,
        totalAmountOfEachProduct
      });
    } else {
      res.json({ status: false, message: update.message });
    }
  };
  
  const removeCartItem = async (req, res) => {
    try {
      const userId = req.session.user;
      const productId = req.params.id;
      console.log("inside remove cart",productId,userId);
      const result = await cartHelper.removeItemFromCart(userId, productId);
      
      if (result) {
        res.json({ status: true });
      } else {
        res.json({ status: false });
      }
    } catch (error) {
      console.log(error);
    }
  };

module.exports = {
    getCartPage,
    updateCartQuantity,
    removeCartItem
}