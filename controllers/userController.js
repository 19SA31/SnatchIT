

// const User = require("../models/user-model");
const user = require("../models/user-model")
const userHelper = require("../helper/userHelper")
const otpHelper = require('../helper/otpHelper');
const cartHelper = require('../helper/cartHelper');
const productModel = require('../models/product-model')
const categoryModel = require("../models/category-model");
const cartModel = require('../models/cart-model')
const productHelper = require('../helper/productHelper')
const categoryHelper = require('../helper/categoryHelper')
const orderHelper = require('../helper/orderHelper')
const wishlistHelper = require('../helper/wishlistHelper')
const offerHelper = require('../helper/offerHelper')
const moment = require("moment");

const bcrypt = require("bcrypt");

const loginLoad = (req, res) => {
  try {
    res.render("user/login")
  } catch (error) {
    console.log(error)
  }
}

const checkUser = async (req, res) => {
  console.log("Entered in to chekUser")

  const logemail = req.body.email;
  const logpassword = req.body.password;

  try {

    const loggeduser = await user.findOne({
      email: logemail
    });
    if (!loggeduser) {
      res.render("user/login", {errmessage: "Wrong Email"});
    }
    else {
      bcrypt.compare(logpassword, loggeduser.password)
      .then((passwordsMatch) => {
      if (passwordsMatch) {
          if (loggeduser.isActive) {
            bcrypt.compare(logpassword, loggeduser.password).then((response) => {
              req.session.user = loggeduser._id;
              res.redirect("/SnatchIt-Home");
              console.log(req.session.user);
            })
              .catch((error) => { console.log(error); })
          } else {
            res.render("user/login", { blocked: "User has been Blocked!" });
          }
        }else {
          res.render("user/login", { errmessage: "Wrong Password" });
        }
      })
      .catch((error) => {
        console.error("Error comparing passwords:", error);
        res.render("user/login", { errmessage: "An error occurred" });
      });
    }
  }
  catch (err) {
    console.log(err.message);
  }
};


const loadRegister = (req, res) => {
  try {
    res.render("user/register")
  } catch (error) {
    console.log(error)
  }
}

const loadOTP = (req, res) => {
  try {
    res.render("user/otp-verification")
  } catch (error) {
    console.log(error)
  }
}

const  loadUserProduct = async (req, res) => {
  const id = req.params.id;
  const userData = req.session.user;


  const product = await productModel
    .findById({ _id: id })
    .populate("productCategory")
    .lean();

  const cartStatus = await cartHelper.isAProductInCart(userData, product._id);
  const wishlistStatus = await wishlistHelper.isInWishlist(
    userData,
    product._id
  );
  console.log(cartStatus);
  product.wishlistStatus = wishlistStatus;
  product.cartStatus = cartStatus; 
  res.render("user/user-productPage", {
    product,
    userData,
  });
}



const loadSnatchIt = async (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  try {
    const users = req.session.user;
    const categories = await categoryHelper.getAllcategory();
    let Products = await productHelper.getAllActiveProducts();


    if (users) {
      res.render("user/SnatchIt-Home", {
        products: Products,
        categories,
        users

      });
    } else {
      res.render("user/SnatchIt-Home", {
        products: Products,
        categories

      });
    }



  } catch (error) {
    console.log(error)
  }
}


const insertUserWithVerify = async function (req, res) {
  try {

    const sendedOtp = req.session.otp;
    const verifyOtp = req.body.otp;
    console.log(sendedOtp);
    console.log(verifyOtp);
    console.log("start checking");

    if (sendedOtp === verifyOtp && Date.now() < req.session.otpExpiry) {
      console.log("otp entered before time expires");
      req.session.otpMatched = true;
      console.log("request in insert user");

      const UserData = req.session.insertData;
      console.log(UserData)
      const response = await otpHelper.doSignup(UserData, req.session.otpMatched);
      console.log(response);

      if (!response.status) {
        const error = response.message;
        req.flash("message", error);
        return res.redirect("/register");
      } else {
        const message = response.message;
        req.flash("message", message);
        return res.redirect('/login');
      }
    } else {
      console.log("failed otp verification");
      req.session.otpExpiry = false;
      req.flash("error", "Enter correct otp");
      return res.redirect('/otp-verification');
    }
  } catch (error) {
    console.error(error);
    return res.redirect("/register");
  }
}

const logoutUser = async (req, res) => {
  try {
    if (req.session.user) {
      req.session.destroy((error) => {
        if (error) {
          res.redirect("/SnatchIt-Home");
        } else {
          res.redirect("/SnatchIt-Home");
        }
      });
    } else {
      res.redirect("/SnatchIt-Home");
    }
  } catch (error) {
    console.log(error);
  }
};

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    res.redirect('/SnatchIt-Home');
  }
};

const loadAccount = async(req,res)=>{
  try {
    const userId = req.session.user

    const userData = await user.findOne({_id:userId})
    const walletData = await userHelper.getWalletDetails(userId);
        console.log("HHH",walletData);
        for (const amount of walletData.wallet.details) {
            amount.formattedDate = moment(amount.date).format("MMM Do, YYYY");
          }
    const orderDetails = await orderHelper.getOrderDetails(userId);
    for (const order of orderDetails) {
      const dateString = order.orderedOn;
      order.formattedDate = moment(dateString).format("MMMM Do, YYYY");
      order.formattedTotal = order.totalAmount;
      let quantity = 0;
      for (const product of order.products) {
        quantity += Number(product.quantity);
      }
      order.quantity = quantity;
      quantity = 0;
    }
    res.render("user/user-account",{
      userData,
      orderDetails,
      walletData
    })
  } catch (error) {
    console.log(error);
  }
}




const loadShop = async (req, res, next) => {
  try {
    if (req.query.search) {
      let payload = req.query.search.trim();
      let searchResult = await productModel
        .find({
          productName: { $regex: new RegExp("^" + payload + ".*", "i") },
        })
        .populate("productCategory")
        .exec();
      if (searchResult) {
        var sorted = true;
        var normalSorted = false;
      }

      let userId = req.session.user;
      const categories = await categoryHelper.getAllActiveCategory();

      let cartCount = await cartHelper.getCartCount(userId);

      let wishListCount = await wishlistHelper.getWishListCount(userId);

      let products = await productHelper.getAllActiveProducts();
      for (const product of products) {
        const cartStatus = await cartHelper.isAProductInCart(
          userId,
          product._id
        );
        const wishlistStatus = await wishlistHelper.isInWishlist(
          userId,
          product._id
        );
      }
      const offerPrice = await offerHelper.findOffer(searchResult);

      let itemsPerPage = 6;
      let currentPage = parseInt(req.query.page) || 1;
      let startIndex = (currentPage - 1) * itemsPerPage;
      let endIndex = startIndex + itemsPerPage;
      let totalPages = Math.ceil(offerPrice.length / 6);
      console.log("total pages ",totalPages);
      const currentProduct = offerPrice.slice(startIndex, endIndex);

      res.render("user/user-shop", {
        products: offerPrice,
        userData: req.session.user,
        cartCount,
        wishListCount,
        categories,
        sorted,
        normalSorted,
        totalPages,
        payload,
      });
    } else {
      let userId = req.session.user;
      const categories = await categoryHelper.getAllcategory();

      let cartCount = await cartHelper.getCartCount(userId);

      let wishListCount = await wishlistHelper.getWishListCount(userId);

      let products = await productHelper.getAllActiveProducts();

      const offerPrice = await offerHelper.findOffer(products);
      let sorted = false;
      
      if (req.query.filter) {
        if (req.query.filter == "Ascending") {
          console.log("inside ascending");
          
          offerPrice.sort(
            (a, b) => a.productPrice - b.productPrice
          );
          normalSorted="Ascending"
       
        } else if (req.query.filter == "Descending") {
          offerPrice.sort(
            (a, b) => b.productPrice - a.productPrice
          );
          normalSorted="Descending"
      
        } else if (req.query.filter == "Alpha") {
          offerPrice.sort((a, b) => {
            const nameA = a.productName.toUpperCase();
            const nameB = b.productName.toUpperCase();
            if (nameA < nameB) {
              return -1;
            }
            if (nameA > nameB) {
              return 1;
            }
            return 0;
          });
          normalSorted="Alpha"
        }
      }

      let itemsPerPage = 6;
      let currentPage = parseInt(req.query.page) || 1;
      let startIndex = (currentPage - 1) * itemsPerPage;
      let endIndex = startIndex + itemsPerPage;
      let totalPages = Math.ceil(offerPrice.length / 6);
      console.log("total pages ",totalPages);
      const currentProduct = offerPrice.slice(startIndex, endIndex);

      res.render("user/user-shop", {
        products: currentProduct,
        userData: req.session.user,
        cartCount,
        wishListCount,
        categories,
        normalSorted,
        totalPages: totalPages,sorted,filter:req.query.filter
      });
    }
  } catch (error) {
    next(error);
  }
};


const shopFilterLoad = async (req, res, next) => {
  try {
    console.log("SHOP FILTER reached here");
    let filteredProducts;
    const extractPrice = (price) => parseInt(price.replace(/[^\d]/g, ""));
    const { search, category, sort, page, limit } = req.query;
    if (category) {
      console.log("if in shop filter");
      let userId = req.session.user;
      var categories = await categoryHelper.getAllcategory();

      var cartCount = await cartHelper.getCartCount(userId);

      var wishListCount = await wishlistHelper.getWishListCount(userId);

      var products = await productHelper.getAllActiveProducts();
      

      let categorySortedProducts = await products.filter((product) => {
        return product.productCategory.toString().trim() == category.trim();
      });

      filteredProducts = await offerHelper.findOffer(categorySortedProducts);
      var sorted = false;
    }
    console.log(filteredProducts);
    if (sort) {
      console.log("if in shop filter----sort");
      if (sort == "Ascending") {
        console.log("inside ascending");
        filteredProducts.sort(
          (a, b) => extractPrice(a.productPrice) - extractPrice(b.productPrice)
        );
        sorted = "Ascending";
      } else if (sort == "Descending") {
        filteredProducts.sort(
          (a, b) => extractPrice(b.productPrice) - extractPrice(a.productPrice)
        );
        sorted = "Descending";
      } else if (sort == "Alpha") {
        filteredProducts.sort((a, b) => {
          const nameA = a.productName.toUpperCase();
          const nameB = b.productName.toUpperCase();
          if (nameA < nameB) {
            return -1;
          }
          if (nameA > nameB) {
            return 1;
          }
          return 0;
        });
        sorted = "Alpha";
      }
    }
    
    let itemsPerPage = 6;
    let currentPage = parseInt(req.query.page) || 1;
    let startIndex = (currentPage - 1) * itemsPerPage;
    let endIndex = startIndex + itemsPerPage;
    let totalPages = Math.ceil(filteredProducts.length / 6);
    const currentProduct = filteredProducts.slice(startIndex, endIndex);
    res.json({
      products: currentProduct,
      totalPages,
      userData: req.session.user,
      cartCount,
      wishListCount,
      categories,
      sorted,
      
    });
  } catch (error) {
    next(error);
  }
};

const addAddress = async(req,res,next)=>{
  try {
    const addressBody= [req.body];
    console.log("this is add address in controller");
    const userId = req.session.user;
    const results = await userHelper.addAddressToUser(addressBody,userId);
    console.log(results);
    if(results){
      console.log("heryyyy");
      res.json({status:true})
    }
  } catch (error) {
    next(error);
  }
}

const updateUser =async(req,res,next)=>{
  try {
    const userId = req.session.user;
    console.log(userId);
    const userDetails = req.body;
    const result = await userHelper.updateUserDetails( userId,userDetails );
    res.json(result)
  } catch (error) {
    console.log(error);
  }
}

const updatePassword = async(req,res,next)=>{
  try {
    const userId = req.session.user;
    const passwordDetails = req.body
    console.log("this is update password controller",userId);
    const result = await userHelper.updateUserPassword(userId,passwordDetails);
    res.json(result);
  } catch (error){
    console.log(error);
  }
}

const addressEditModal = async (req, res) => {
  try {
    console.log("entered in Add edit modal");
    const userId = req.params.userId;
    const addressId = req.params.addressId;

    // Assuming you have a User model
    const userData = await user.findById(userId);
    console.log(userId)
    if (userData) {
      
      const addressData = userData.address.id(addressId);
      
      if (addressData) {
        console.log(addressData);
        res.json({ addressData });
      } else {
        res.status(404).json({ message: 'Address not found' });
      }
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const editAddress = async (req,res,next)=>{
  try {
    console.log("entered into editAddress controller");
    const userId = req.session.user;
    console.log(userId);
    const addressId = req.params.id;
    const body = req.body;
    const result = await userHelper.editAddressHelper(userId,addressId,body)
    if(result){
      console.log(result);
      res.json(result)
    }
  } catch (error) {
    console.log(error);
  }
}

const deleteAddress = async(req,res,next)=>{
  try {
    console.log(("Entered into deleteAddress controller"));
    const userId = req.session.user;
    const addressId = req.params.id;
    const result = await userHelper.deleteAddressHelper(userId,addressId);
    if(result){
      console.log(result);
      res.json(result);
    }
  } catch (error) {
    console.log(error);
  }
}









module.exports = {
  loginLoad,
  loadRegister,
  loadOTP,
  loadUserProduct,
  checkUser,
  loadSnatchIt,
  insertUserWithVerify,
  logoutUser,
  isAuthenticated,
  loadAccount,
  addAddress,
  updateUser,
  updatePassword,
  addressEditModal,
  editAddress,
  deleteAddress,
  loadShop,
  shopFilterLoad
  
  

}