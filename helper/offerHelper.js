const offerModel = require("../models/offer-model");

const createCategoryOffer = (data) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await offerModel.create({
          offerName: data.offerName,
          startingDate: data.startDate,
          endingDate: data.endDate,
          "categoryOffer.category": data.categoryName,
          "categoryOffer.discount": data.discountAmount,
          "categoryOffer.offerStatus": true,
        });
        resolve(result);
      } catch (error) {
        console.log(error);
      }
    });
  };

  const listUnlistCategoryOffer = (offerId) => {
    return new Promise(async (resolve, reject) => {
        const result = await offerModel.findOne({ _id: offerId });
        if(result.status===true){
            await offerModel.findByIdAndUpdate({_id:offerId},{$set:{status:false}});
        }else{
            await offerModel.findByIdAndUpdate({_id:offerId},{$set:{status:true}});
        }
      resolve(result);
    });
  };



const getAllOffersOfCategories = () => {
    return new Promise(async (resolve, reject) => {
      try {
        const offers = await offerModel
          .find({ "categoryOffer.offerStatus": true })
          .populate("categoryOffer.category");
        for (const offer of offers) {
          offer.formattedStartingDate = formatDate(offer.startingDate.toString());
          offer.formattedEndingDate = formatDate(offer.endingDate.toString());
        }
        if (offers) {
          resolve(offers);
        }
      } catch (error) {
        console.log(error);
      }
    });
  };

  const getOfferDetails = (offerId) => {
    return new Promise(async (resolve, reject) => {
      const result = await offerModel.findOne({ _id: offerId }).lean();
  
      result.formattedStartingDate = formatDate(result.startingDate.toString());
      result.formattedEndingDate = formatDate(result.endingDate.toString());
  
      if (result) {
        resolve(result);
      }
    });
  };


  const editCategoryOffer = (data) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await offerModel.updateOne(
          { _id: data.offerId },
          {
            $set: {
              offerName: data.offerName,
              startingDate: data.startDate,
              endingDate: data.endDate,
              "categoryOffer.category": data.categoryName,
              "categoryOffer.discount": data.discountAmount,
              "categoryOffer.offerStatus": true,
            },
          }
        );
        resolve(result);
      } catch (error) {
        console.log(error);
      }
    });
  };


const getAllOffersOfProducts = () => {
    return new Promise(async (resolve, reject) => {
      try {
        const offers = await offerModel
          .find({ "productOffer.offerStatus": true })
          .populate("productOffer.product");
        for (const offer of offers) {
          offer.formattedStartingDate = formatDate(offer.startingDate.toString());
          offer.formattedEndingDate = formatDate(offer.endingDate.toString());
        }
        if (offers) {
          resolve(offers);
        }
      } catch (error) {
        console.log(error);
      }
    });
  };


  function formatDate(dateString) {
    // Create a Date object from the string
    const date = new Date(dateString);
  
    // Get the year, month, and day components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Add leading zero if needed
    const day = String(date.getDate()).padStart(2, "0"); // Add leading zero if needed
  
    // Format the date in YYYY/MM/DD format
    return `${year}/${month}/${day}`;
  }

  const findOffer = (products) => {
    return new Promise(async (resolve, reject) => {
      try {
        const currentDate = new Date();
        const offer = await getActiveOffer(currentDate);
  
        for (let i = 0; i < products.length; i++) {
          const productOffer = offer.find(
            (item) => item.productOffer?.product?.toString() == products[i]._id
          );
  
          const categoryOffer = offer.find(
            (item) =>
              item.categoryOffer?.category?.toString() ==
              products[i].productCategory._id
          );
  
          if (productOffer != undefined && categoryOffer != undefined) {
            if (
              productOffer.productOffer.discount >
              categoryOffer.categoryOffer.discount
            ) {
              const offerPrice =
                products[i].productPrice -
                (products[i].productPrice * productOffer.productOffer.discount) /
                  100;
              products[i].offerPrice = offerPrice;
            } else {
              const offerPrice =
                products[i].productPrice -
                (products[i].productPrice *
                  categoryOffer.categoryOffer.discount) /
                  100;
              products[i].offerPrice = offerPrice;
            }
          } else if (productOffer != undefined) {
            const offerPrice =
              products[i].productPrice -
              (products[i].productPrice * productOffer.productOffer.discount) /
                100;
            products[i].offerPrice = offerPrice;
          } else if (categoryOffer != undefined) {
            const offerPrice =
              products[i].productPrice -
              (products[i].productPrice * categoryOffer.categoryOffer.discount) /
                100;
            products[i].offerPrice = offerPrice;
          } else {
            const offerPrice =
              products[i].productPrice -
              (products[i].productPrice * products[i].productDiscount) / 100;
            products[i].offerPrice = offerPrice;
          }
          products[i].productPrice = products[i].productPrice;
        }
        resolve(products);
      } catch (error) {
        console.log(error);
      }
    });
  };

  const getActiveOffer = (currentDate) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await offerModel.find({
          startingDate: { $lte: currentDate },
          endingDate: { $gte: currentDate },
          status: true,
        });
        // .populate("productOffer.product")
        // .populate("categoryOffer.category");
  
        resolve(result);
      } catch (error) {
        console.log(error);
      }
    });
  };

  

  module.exports = {
    createCategoryOffer,
    getAllOffersOfCategories,
    listUnlistCategoryOffer,
    getOfferDetails,
    editCategoryOffer,
    getAllOffersOfProducts,
    findOffer,
    getActiveOffer
  }