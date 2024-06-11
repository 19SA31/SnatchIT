const { log } = require("console");
const productModel = require("../models/product-model");
const productHelper = require("../helper/productHelper");
const fs = require("fs");
const path = require('path');
const sharp = require('sharp');


const addProduct = (data, files, req, res) => {

  const { hiddenField1, hiddenField2, hiddenField3, hiddenField4, } = data;
  console.log("hello",data);
  
  return new Promise(async (resolve, reject) => {
    try {
      // Check for duplicate product name
      const duplicateCheck = await checkDuplicateFunction(data, null);
      if (duplicateCheck.status === 1) {
        console.log("No duplicate found, proceeding to add product.");
        console.log("Hey");
        console.log(files);
        let images = []
        for (const file of files) {
          images.push(file.filename)
        }
        console.log(images)


        let totalQuantity =
          parseInt(data.smallQuantity) +
          parseInt(data.mediumQuantity) +
          parseInt(data.largeQuantity);

        const productQuantity = [
          {
            size: "S",
            quantity: parseInt(data.smallQuantity),
          },
          {
            size: "M",
            quantity: parseInt(data.mediumQuantity),
          },
          {
            size: "L",
            quantity: parseInt(data.largeQuantity),
          },
        ];
        console.log(productQuantity);
        const newProduct = await productModel.create({
          productName: data.productName, // Corrected the field name to "productName"
          productDescription: data.description,
          productCategory: data.productCategory,
          productPrice: data.price,
          productQuantity: productQuantity,
          productDiscount: data.discount,
          totalQuantity: totalQuantity,
          productImage: images,
        });

        const cropPromises = [];

      
      async function cropImage(hiddenfield) {
          return new Promise((resolve, reject) => {
              let parts = hiddenfield.split(" ");
              console.log("crop",parts);
              let ind = parseInt(parts[1]);
              console.log("ind",ind);
              
              let x = parseInt(parts[3]);
              let y = parseInt(parts[5]);
              let width = parseInt(parts[7]);
              let height = parseInt(parts[9]);
             console.log("newProduct.image[ind]",newProduct);
              let filename = newProduct.productImage[ind];
              let inputPath = path.join(__dirname, `../public/uploads/${filename}`);
              let outputPath = path.join(__dirname, `../public/uploads/cropped_${filename}`);
      
              sharp(inputPath)
                  .extract({ left: x, top: y, width: width, height: height })
                  .toFile(outputPath, (err) => {
                      if (err) {
                          console.error("Error cropping image:", err);
                          reject(err);
                      } else {
                          // Update the product image path with the cropped image
                          let croppedFilename = `cropped_${filename}`;
                          newProduct.productImage[ind] = croppedFilename;
                          console.log("fine")
      
                          // try {
                          //     // Attempt to unlink the file
                          //     fs.unlinkSync(inputPath);
                          //     console.log('File unlinked successfully');
                          // } catch (err) {
                          //     // Handle the error
                          //     console.error('Error unlinking file:', err);
                          //     // You can take further action here, such as retrying or notifying the user
                          // }
                          // // Resolve the promise
                          resolve();
                      }
                  });
          });
      }
      

      // Push crop promises to array
      if (hiddenField1) {
          cropPromises.push(cropImage(hiddenField1));
      }
      if (hiddenField2) {
          cropPromises.push(cropImage(hiddenField2));
      }
      if (hiddenField3) {
          cropPromises.push(cropImage(hiddenField3));
      }
      if (hiddenField4) {
          cropPromises.push(cropImage(hiddenField4));
      }
     
      

      
      await Promise.all(cropPromises);

      
      await newProduct.save();

      const message = "Product added successfully";
      resolve(true)
      } else {
        console.log("Duplicate found, not adding product.");
        resolve({ message: "Duplicate product name found", status: 3 });

        req.flash("error", "Product with the same name already exists!");

        // Redirect to the same page
        res.redirect("/admin-addProduct");
        
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
};


const checkDuplicateFunction = (body, productId) => {
  return new Promise(async (resolve, reject) => {
    // const checker = await productModel.findOne({ _id: productId });
    const check = await productModel.findOne({
      productName: body.productName,
    });

    if (!check) {
      
      resolve({ status: 1 });
    } else if (productId == check._id) {
 
      resolve({ status: 2 });
    } else {
  
      resolve({ status: 3 });
    }
  });
};

const productListUnlist = (id) => {
  return new Promise(async (resolve, reject) => {
    const result = await productModel.findOne({ _id: id });
    result.productStatus = !result.productStatus;
    result.save();
    console.log(result);
    resolve(result);
  });
};

const editProductPost = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) {
      res.redirect("/admin-products");
    }
   
    const totalAmount =
      parseInt(req.body.smallQuantity) +
      parseInt(req.body.mediumQuantity) +
      parseInt(req.body.largeQuantity);
    console.log(totalAmount);
    const check = await checkDuplicateFunction(
      req.body,
      req.params.id
    );
    const productQuantity = [
      {
        size:"S",
        quantity:req.body.smallQuantity
      },
      {
        size:"M",
        quantity:req.body.mediumQuantity
      },
      {
        size:"L",
        quantity:req.body.largeQuantity
      }
    ]
    switch (check.status) {
      case 1:
        console.log("Case1");
        product.productName = req.body.productName;
        product.productDescription = req.body.productDescription;
        product.productPrice = req.body.productPrice;
        product.productQuantity = productQuantity;
        product.totalQuantity = totalAmount;
        product.productCategory = req.body.productCategory;
        product.productDiscount = req.body.productDiscount;
        break;
      case 2:
        console.log("Case2");
        product.productName = req.body.productName;
        product.productDescription = req.body.productDescription;
        product.productPrice = req.body.productPrice;
        product.productQuantity = productQuantity;
        product.totalQuantity = totalAmount;
        product.productCategory = req.body.productCategory;
        product.productDiscount = req.body.productDiscount;
        break;
      case 3:
        console.log("Case3\nProduct already Exists");
        break;
      default:
        console.log("error");
        break;
    }
    if (req.files) {
      const filenames = await editImages(
        product.productImage,
        req.files
      );
      product.productImage = filenames;
     
    }
    await product.save();
    res.redirect("/admin-products");
  } catch (err) {
    console.log(err);
  }
};

const editImages = async (oldImages, newImages) => {
  return new Promise((resolve, reject) => {
    if (newImages && newImages.length > 0) {
      // if new files are uploaded
      let filenames = [];
      for (let i = 0; i < newImages.length; i++) {
        filenames.push(newImages[i].filename);
      }
      // delete old images if they exist
      if (oldImages && oldImages.length > 0) {
        for (let i = 0; i < oldImages.length; i++) {
          fs.unlink("public/uploads/" + oldImages[i], (err) => {
            if (err) {
              reject(err);
            }
          });
        }
      }
      resolve(filenames);
    } else {
      // use old images if new images are not uploaded
      resolve(oldImages);
    }
  });
}

const getAllActiveProducts = () => {
  return new Promise(async (resolve, reject) => {
    try {

      const result = await productModel.aggregate([
        {
          $lookup: {
            from: "categories",
            localField: "productCategory",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $match: {
            productStatus: true,
            "category.isListed": true,
          },
        },
      ]);

      resolve(result);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
};

const getAllProducts = () => {
  return new Promise(async (resolve, reject) => {
    const product = await productModel
      .aggregate([
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },
      ])
      .then((result) => {
        console.log(result);
        resolve(result);
      })
      .catch((error) => {
        console.log(error);
      });
  });
};


module.exports = {
  addProduct,
  checkDuplicateFunction,
  productListUnlist,
  editProductPost,
  getAllActiveProducts,
  getAllProducts
}