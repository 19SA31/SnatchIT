const wishlistModel = require("../models/wishlist-model");
const productModel = require('../models/product-model')
const ObjectId = require("mongoose").Types.ObjectId;

const getWishListCount = (userId) => {
    return new Promise(async (resolve, reject) => {
      let wishlist = await wishlistModel.findOne({ user: userId });
      let wishlistCount = wishlist?.products.length;
      resolve(wishlistCount);
    });
};

const getAllWishlistProducts = (userId) => {
    return new Promise(async (resolve, reject) => {
      let wishlistProducts = await wishlistModel.aggregate([
        {
          $match: {
            user: new ObjectId(userId),
          },
        },
  
        {
          $unwind: "$products",
        },
        {
          $project: {
            item: "$products.productId",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "item",
            foreignField: "_id",
            as: "product",
          },
        },
        {
          $project: {
            item: 1,
            product: {
              $arrayElemAt: ["$product", 0],
            },
          },
        },
      ]);
      resolve(wishlistProducts);
    });
  };
  

  const addToWishlist = (userId, productId) => {
    return new Promise(async (resolve, reject) => {
      console.log(productId);
      const product = await productModel.findOne({ _id: productId });
  
      if (!product || !product.productStatus) {
        reject(Error("Product Not Found"));
        return;
      }
  
      const wishlist = await wishlistModel.updateOne(
        {
          user: userId,
        },
        {
          $push: {
            products: { productId: productId },
          },
        },
        {
          upsert: true,
        }
      );
  
      resolve(wishlist);
    });
  };

  const removeProductFromWishlist = (userId, productId) => {
    return new Promise(async (resolve, reject) => {
      const removeItemss = await wishlistModel.findOne({
        user: new ObjectId(userId),
      });
      console.log("ajscjac", removeItemss);
      await wishlistModel.updateOne(
          {
            user: new ObjectId(userId),
          },
          {
            $pull: {
              products: {
                productId: productId,
              },
            },
          }
        )
        .then((result) => {
          resolve(result);
        });
    });
  };


  const isInWishlist = (userId, productId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const wishList = await wishlistModel.findOne({
          user: userId,
          "products.productItemId": productId,
        });
  
        if (wishList) {
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (error) {
        console.log(error);
        reject(error);
      }
    });
  };

module.exports= {
    getWishListCount,
    getAllWishlistProducts,
    addToWishlist,
    removeProductFromWishlist,
    isInWishlist
}