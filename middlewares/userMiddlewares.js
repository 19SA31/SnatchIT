



const isLogin= (req,res,next)=>{
    try{
        
        if(req.session.user){
            res.redirect("/SnatchIt-Home");

    }else{
        next();
    }
    

}catch(error){
    console.log(error);
}
}

const isLogout= async(req,res,next)=>{
    try{
        
        if(req.session.user){
          next();
    }else{
      res.redirect("/login");
    }
    

}catch(error){
    console.log(error);
}
}

const destroySessionOnBlock = (req, res, next) => {
    try {
      // Assuming req.session.user contains the information about the logged-in user
      const loggedInUser = req.session.user;
  
      // Assuming req.body.isActive contains the value of the isActive field from the user model
      const isActive = req.body.isActive;
  
      // Check if the user is blocking themselves (isActive is false)
      if (loggedInUser && !isActive) {
        // Destroy the session of the user
        req.session.destroy((err) => {
          if (err) {
            console.error("Error destroying session:", err);
          }
          // Redirect or send a response after destroying the session
          res.redirect("/SnatchIt-Home");
        });
      } else {
        // If the user is not blocking themselves, proceed to the next middleware
        next();
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

module.exports={
    isLogin,
    isLogout,
    destroySessionOnBlock
}