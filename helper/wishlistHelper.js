const wishlistModel = require("../models/wishlist-model");
const productModel = require('../models/product-model')
const ObjectId = require("mongoose").Types.ObjectId;

const getWishListCount = async (userId) => {
  try {
    const wishlist = await wishlistModel.findOne({ user: userId });
    return wishlist ? wishlist.products.length : 0;
  } catch (error) {
    console.log(error);
    return 0;
  }
};


const getAllWishlistProducts = async (userId) => {
  try {
    const wishlistProducts = await wishlistModel.aggregate([
      {
        $match: {
          user: new ObjectId(userId),
        },
      },
      {
        $unwind: "$products",
      },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $project: {
          item: "$products.productId",
          product: { $arrayElemAt: ["$product", 0] },
        },
      },
    ]);
    return wishlistProducts;
  } catch (error) {
    console.log(error);
    return [];
  }
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
          "products.productId": productId,
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