const offerHelper = require("../helper/offerHelper");
const productHelper = require("../helper/productHelper");
const categoryHelper = require("../helper/categoryHelper");
const offerModel = require("../models/offer-model");



const categoryOfferLoad = async (req, res) => {
  try {
    const offers = await offerHelper.getAllOffersOfCategories();
    const categories = await categoryHelper.getAllActiveCategory();
    const message = req.flash("message");
    if (message.length > 0) {
      console.log(message);
      res.render("admin/admin-categoryOffer", { offers, categories, message });
    } else {
      res.render("admin/admin-categoryOffer", { offers, categories });
    }

  } catch (error) {
    console.log(error);
  }
}

const addCategoryOffer = async (req, res) => {
  try {
    console.log("###consoling", req.body);
    const exisitingOffer = await offerModel.findOne(
      { offerName: { $regex: new RegExp(req.body.offerName, "i") } })
    console.log("###", exisitingOffer);
    if (exisitingOffer) {

      req.flash("message", "Offer already exists");
      res.redirect("/admin-categoryOffer");
    } else {
      const offer = await offerHelper.createCategoryOffer(req.body);
      if (offer) {
        req.flash("message", "Offer updated succesfully");
        res.redirect("/admin-categoryOffer");
      }
    }
  } catch (error) {
    console.log(error)
  }
}

const listUnlistOfferCategory = async (req, res) => {
  try {
    const result = await offerHelper.listUnlistCategoryOffer(req.params.id);
    if (result.status) {
      res.json({ message: "Offer Unlisted", listed: false });
    } else {
      res.json({ message: "Offer Listed", listed: true });
    }
  } catch (error) {
    console.log(error);
  }
}

const categoryEditLoad = async (req, res) => {
  try {
    console.log('reached')
    const offerId = req.params.id;
    const response = await offerHelper.getOfferDetails(offerId);
    res.json(response);

  } catch (error) {
    console.log(error);
  }
}

const categoryEditOffer = async (req, res) => {
  try {
    const offer = req.body.offerName1
    const checkDuplicate = await offerModel.findOne({ offerName: offer })
    if ( checkDuplicate && checkDuplicate.categoryOffer.discount == req.body.offerDiscount1) {
      req.flash("message", "Offer name already exists");
      res.redirect("/admin-categoryOffer");
    } else {
      const result = await offerHelper.editCategoryOffer(req.body);
      if (result) {
        req.flash("message", "Offer edited");
        res.redirect("/admin-categoryOffer");
      }
    }
  } catch (error) {
    console.log(error);
  }
}


const productOfferLoad = async (req, res) => {
  try {
    const offers = await offerHelper.getAllOffersOfProducts();
    const products = await productHelper.getAllProducts();
    const message = req.flash("message");
    if (message.length > 0) {
      console.log(message);
      res.render("admin/admin-offerManagement", { offers, products, message });
    } else {
      res.render("admin/admin-offerManagement", { offers, products });
    }
  } catch (error) {
    console.log(error);
  }
};



module.exports = {
  categoryOfferLoad,
  addCategoryOffer,
  categoryEditLoad,
  listUnlistOfferCategory,
  categoryEditOffer,
  productOfferLoad,

}