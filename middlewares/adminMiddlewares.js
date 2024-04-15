



const isLoginAdmin= (req,res,next)=>{
    try{
        if(req.session.admin){
            res.redirect("/admin-dashboard");

    }else{
        next();
    }
    

}catch(error){
    console.log(error);
}
}

const isLogoutAdmin= (req,res,next)=>{
    try{
        if(req.session.admin){
            next();
            

    }else{
        res.redirect("/admin-login");
    }
    

}catch(error){
    console.log(error);
}
}

module.exports={
    isLoginAdmin,
    isLogoutAdmin
}