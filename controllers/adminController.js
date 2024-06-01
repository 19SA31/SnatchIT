const user = require("../models/user-model");
const admin = require("../models/admin-model");
const categoryHelper = require("../helper/categoryHelper");
const categoryModel = require("../models/category-model");
const productHelper = require("../helper/productHelper");
const productModel =  require("../models/product-model");
const orderModel =  require("../models/order-model");
const fs = require("fs");
const bcrypt=require("bcrypt");

const adminLogin = (req,res)=>{
    try {
        res.render("admin/admin-login")
    } catch (error) {
        console.log(error);
    }
}

const loadDashboard = async(req,res)=>{
  try {
    
    const salesDetails = await orderModel.find();
    console.log("sales",salesDetails);

   
    const products = await productModel.find();
    const categories = await categoryModel.find();

   
    const topSellingProducts = await orderModel.aggregate([
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product",
          totalQuantity: { $sum: "$products.quantity" },
        },
      }, 
      { $sort: { totalQuantity: -1 } }, 
      { $limit: 10 }, 
    ]);

    
    const productIds = topSellingProducts.map((product) => product._id);

    
   
    const productsData = await productModel.find(
      { _id: { $in: productIds } },
      { name: 1, image: 1 }
    );

    
    const topSellingCategories = await orderModel.aggregate([
      { $unwind: "$products" }, 
      {
        $lookup: {
          from: "products",
          localField: "products.product",
          foreignField: "_id",
          as: "product",
        },
      }, 
      { $unwind: "$product" },
      {
        $lookup: {
          from: "categories",
          localField: "product.category",
          foreignField: "_id",
          as: "category",
        },
      }, 
      
      { $unwind: "$category" }, 
      {
        $group: {
          _id: "$category._id",
          totalQuantity: { $sum: "$products.quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } }, 
      { $limit: 10 },
    ]);

  
    const topSellingCategoriesData = await categoryModel.find({
      _id: { $in: topSellingCategories.map((cat) => cat._id) },
    });

    res.render("admin/admin-dashboard", {
      salesDetails: salesDetails,
      products: products,
      categories: categories,
      productsData: productsData,
      topSellingCategories: topSellingCategoriesData,
      topSellingProducts: topSellingProducts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
}

const adminCategory = (req, res) => {
    try {
        res.render("admin/admin-category");
    } catch (error) {
        console.log(error);
    }
}

const adminProducts = async(req, res) => {
    try {
    
        const products = await productModel.find().populate("productCategory");
        res.render("admin/admin-products", { products } );
    } catch (error) {
        console.log(error);
    }
}

const adminUserEdit = async (req, res) => {
    try {
        const users = await user.find();
        res.render("admin/admin-userEdit", { users });
    } catch (error) {
        console.log(error);
    }
}

const adminDashboard = async (req,res)=>{
    try {
        res.render("admin/admin-userEdit");
    } catch (error) {
        console.log(error)
    }
}

const loadEditCat = async (req,res)=>{
    try {
        res.render("admin/admin-editCategory");
    } catch (error) {
        console.log(error)
    }
}

const loadAddProduct = async (req, res) => {
    try {
        const categories = await categoryModel.find();
        res.render("admin/admin-addproduct", { categories });
    } catch (error) {
        console.log(error);
    }
}

const adminCatListUnlist = async (req,res) =>{
    try {
        categoryModel.find().then((response)=>{
        
        res.render("admin/admin-category",{categories:response});

        })
        
    } catch (error) {
        console.log(error); 
    }
}

const userBlockUnblock = async (req, res) => {
  const id = req.params.id;
  const result = await user.findOne({ _id: id });
  result.isActive = !result.isActive;
  result.save();
  if (!result.isActive) {
    console.log(req.session.user);
    delete req.session.user;
  }
  let message;
  if (result.isActive) {
    message = "User Unblocked";
  } else {
    message = "User Blocked";
  }
  res.json({ message: message });
};

const addCategory = async (req, res) => {
    const userId = req.session.user;
    const { productName, productDescription } = req.body;
    const result = await categoryHelper.addCat(productName,productDescription);
    if (result) {
        res.json({ status: true })
    } else {

        res.json({ status: false });
    }

}

const listUnlist= async (req,res)=>{
    try {
        console.log("Entered into listUnlist");
        let categoryId=req.query.id;  
        let findCat= await categoryModel.findById({_id:categoryId});

        if(findCat.isListed===true){
            await categoryModel.findByIdAndUpdate({_id:categoryId},{$set:{isListed:false}});
        }else{
            await categoryModel.findByIdAndUpdate({_id:categoryId},{$set:{isListed:true}});
        }
        res.json({success:true})
    } catch (error) {
        console.log(error);
    }
}

const checkAdmin= async(req,res)=>{
    console.log("Entered in to checkadmin")
  
    const logemail= req.body.email;
    const logpassword= req.body.password;
    console.log(logemail);
    
    try{
      
      const loggedAdmin = await admin.findOne({
        email: logemail
      }).catch(error => console.error('Mongoose findOne error:', error));;
      console.log(loggedAdmin)
      
    
      if(logpassword === loggedAdmin.password){
        
          req.session.admin=loggedAdmin._id;
          res.redirect("/admin-dashboard");
          console.log(loggedAdmin)
          console.log(req.session.admin);
        
      }else{
        res.redirect("/admin-login");
      }
      
    }catch(err){
      console.log(err.message);
    }
  };

  const logoutAdmin = async (req, res) => {
    try {
      if (req.session.admin) {
        req.session.destroy((error) => {
          if (error) {
            res.redirect("/admin-dashboard");
          } else {
            res.redirect("/admin-login");
          }
        });
      } else {
        res.redirect("/admin-login");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.admin) {
      return next();
    } else {
      res.redirect('/admin-login'); 
    }
  };


  const addProduct = (req, res) => {
    const body = req.body;
    const files = req.files;
    productHelper
      .addProduct(body, files,req,res)
      .then((response) => {
        res.redirect("/admin-products");
      })
      .catch((error) => {
        console.log(error);
      });
  };


  const softDeleteProduct = (req, res) => {
    const id = req.params.id;
    productHelper
      .productListUnlist(id)
      .then((response) => {
        if (response.productStatus) {
          res.json({ message: "Listed Successfuly" });
        } else {
          res.json({ message: "Unlisted Succesfuly" });
        }
      })
      .catch((error) => {
        res.json({ error: "Failed" });
      });
  };

  const editProductLoad = async (req, res) => {
    const id = req.params.id;
    const categories = await categoryHelper.getAllcategory();
    const productDetail = await productModel.findOne({ _id: id });

    res.render("admin/admin-editProduct", {
      product: productDetail,
      category: categories,
    });
  };

  const deleteImage = async (req,res)=>{
    try{
      
      const productId = req.params.id;
      const image = req.params.image;
  
      
  
      const updatedProduct = await productModel.findByIdAndUpdate(
        {_id:productId},
        { $pull: { productImage: image } }, // Use $pull to remove the specified image from the images array
        { new: true } // Set { new: true } to return the updated document after the update operation
    );
    
    fs.unlink("public/uploads/" + image, (err) => {
      if (err) {
        reject(err);
      }
    });
  
    if(updatedProduct){
      res.json({message : "image deleted"});
  
    }else{
      res.json({message : "something went wrong"});
  
    }
    }catch(error){
      console.log(error)
  
    }
  }

  




module.exports = {
    adminLogin,
    logoutAdmin,
    isAuthenticated,
    loadDashboard,
    adminDashboard,
    adminCategory,
    loadEditCat,
    adminProducts,
    adminUserEdit,
    userBlockUnblock,
    addCategory,
    listUnlist,
    adminCatListUnlist,
    checkAdmin,
    loadAddProduct,
    addProduct,
    softDeleteProduct,
    editProductLoad,
    deleteImage,

}