const cartHelper = require('../helper/cartHelper');
const productModel = require('../models/product-model')
const orderModel = require('../models/order-model')
const cartModel = require('../models/cart-model')

const addToCart = async (req, res) => {
  
    const userId = req.session.user;
  
    const productId = req.params.id;
    const size = req.params.size;
    console.log("Entered into addToCart",userId,size,productId)
    const result = await cartHelper.addToCartHelper(userId, productId, size);
  
    if (result) {
      res.json({ status: true });
    } else {
      res.json({ status: false });
    }
  };

  const searchProduct = async (req, res, next) => {

    let payload = req.body.payload.trim();
    try {
      let searchResult = await productModel
        .find({ productName: { $regex: new RegExp("^" + payload + ".*", "i") } })
        .exec();
      searchResult = searchResult.slice(0, 5);
      res.json({ searchResult });
    } catch (error) {
      // res.status(500).render("error", { error, layout: false });
      console.log(error);
    }
  };
  

  const fetchPopular = async (req, res) => {
      try {
        // Aggregate orders to find the most ordered products
        const popularProducts = await orderModel.aggregate([
          { $unwind: "$products" },
          { $group: { _id: "$products.product", totalOrders: { $sum: 1 } } },
          { $sort: { totalOrders: -1 } },
          { $limit: 6 }, // Limit to top 10 most ordered products
          {
            $lookup: {
              from: "products",
              localField: "_id",
              foreignField: "_id",
              as: "productDetails"
            }
          }
        ]);
  
        // Extract product details
        const productIds = popularProducts.map(product => product._id);
        const products = await Product.find({ _id: { $in: productIds } });
  
        res.json(products);
      } catch (error) {
        console.error('Error fetching popular products:', error);
        res.status(500).json({ error: 'An error occurred while fetching popular products' });
      }
    }

    const fetchNew = async (req, res) => {
        try {
          // Find newly added products by sorting based on creation date
          const newProducts = await Product.find().sort({ createdAt: -1 }).limit(6);
    
          res.json(newProducts);
        } catch (error) {
          console.error('Error fetching newly added products:', error);
          res.status(500).json({ error: 'An error occurred while fetching newly added products' });
        }
      }

      const productWithSizeCartCheck = async(req, res, next)=>{

        try {

            
         const id = req.query.id;
         const size = req.query.size
         const userId = req.session.user;
         
         const checkProduct = await cartModel.findOne({
             user:userId,
                   
                     "products":{
                       $elemMatch:{
                         productId:id,
                         size:size
                       }
                     
                   }
         },{
           "products":{
             $elemMatch:{
               productId:id,
               size:size
             }
           }
         })
         

         if(checkProduct){
           
           res.json({response:true})
         }else{
          
           res.json({response:false})
         }
         
        } catch (error) {
         console.error("Error in productWithSizeCartCheck: ",error);
         next(error)
         
        }
           
      }

    

  


  module.exports = {
    addToCart,
    searchProduct,
    fetchPopular,
    fetchNew,
    productWithSizeCartCheck,

  }