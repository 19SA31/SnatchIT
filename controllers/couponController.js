const couponHelper = require('../helper/couponHelper')




const couponLoad = async (req,res)=>{
    try {
        let allCoupons = await couponHelper.findAllCoupons();

        for(let i = 0; i< allCoupons.length; i++){
            allCoupons[i].discount = allCoupons[i].discount;
            allCoupons[i].expiryDate = dateFormatter(allCoupons[i].expiryDate);
        }

        const message = req.flash('message');
        if(message){
            res.render("admin/admin-coupon",{
                coupons: allCoupons, message : message
            })
        }else{
            res.render("admin/admin-coupon",{
                coupons: allCoupons,
            })
        }
    } catch (error) {
        console.log(error);
    }
}

const addCoupon = async (req, res) => {
    try {
      if (req.body.couponAmount > 1000) {
        req.flash("message", "Max Coupon Amount Exceeded");
        res.redirect("/admin-coupon");
      } else if (req.body.couponAmount < 1) {
        req.flash("message", "Minimum Coupon Amount Not Met");
        res.redirect('/admin-coupon');
      } else {
        const coupon = await couponHelper.addCoupon(req.body);
        res.redirect("/admin-coupon");
      }
    
    } catch (error) {
    console.log(error);
    }
  };
  

  const deleteCoupon = async (req, res) => {
    try {
      const result = await couponHelper.deleteSelectedCoupon(req.params.id);
      res.json({ message: "Coupon deleted" });
    } catch (error) {
      console.log(error);
    }
  };

  const getEditCoupon = async (req, res) => {
    try {
      const couponData = await couponHelper.getCouponData(req.params.id);
  
      couponData.expiryDate = dateFormatter(couponData.expiryDate);
  
      res.json({ couponData });
    } catch (error) {
      console.log(error);
    }
  };

  const editCoupon = async (req, res) => {
    try {
      let editedCoupon = await couponHelper.editCouponDetails(req.body);
  
      res.redirect("/admin-coupon");
    } catch (error) {
      console.log(error);
    }
  };

  const applyCoupon = async (req, res) => {
    try {
      const price = parseInt(req.query.price);
    
      const userId = req.session.user;
      const couponCode = req.body;
      if (price > 1500) {
        const result = await couponHelper.applyCoupon(userId, couponCode);
        console.log(result);
        if (result.status) {
          res.json({ result:result,status:true,message:"Coupon Applied Successfuly" }); 
        } else {
          res.json({ result:result,status:true,message:result.message }); 
        }
    
      } else {
        res.json({ message: "Please purchase for 1500 above to apply coupon" ,status:false});
      }
    } catch (error) {
      console.log(error);
    }
  };



  function dateFormatter(date) {
    return date.toISOString().slice(0, 10);
  }



module.exports = {
    couponLoad,
    addCoupon,
    deleteCoupon,
    getEditCoupon,
    editCoupon,
    applyCoupon
    
}