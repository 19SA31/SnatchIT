const cartHelper = require('../helper/cartHelper');


const addToCart = async (req, res) => {
    const userId = req.session.user;
  
    const productId = req.params.id;
    const size = req.params.size;
  
    const result = await cartHelper.addToCartHelper(userId, productId, size);
  
    if (result) {
      res.json({ status: true });
    } else {
      res.json({ status: false });
    }
  };

  module.exports = {
    addToCart
  }