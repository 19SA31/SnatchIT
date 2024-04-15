const express = require("express");
const dotenv=require("dotenv").config();
const path= require('path');
const nocache = require("nocache");
const userRoute=require("./routes/userRoute");
const adminRoute=require("./routes/adminRoute");
const flash=require("express-flash");
const session = require("express-session");
const connectDB=require("./database/mongoose");
const methodOverride = require("method-override")


const app = express();
const PORT = 4004;

app.use(express.urlencoded({ extended: true }));
app.use("/public",express.static(path.join(__dirname,"/public")))
app.set("view engine","ejs");

app.use(methodOverride("_method"));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie:{
      maxAge:3600*1000,
    }
}));

app.use(flash());

app.use((req,res,next)=>{
  res.locals.message=req.session.message;
  delete req.session.message;
  next();
})




app.use("/", nocache());
app.use("/",userRoute);
app.use("/",adminRoute);

app.listen(PORT, () => {
  console.log("Server started on http://localhost:4004/");
  console.log("For Admin login on http://localhost:4004/admin-login");
});
