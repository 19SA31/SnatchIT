  const nodemailer = require('nodemailer')
  const user = require("../models/user-model")
  const userController = require("../controllers/userController")
  const bcrypt = require("bcrypt")
  
  function generateotp(){
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  const transporter = nodemailer.createTransport({

    service: "gmail",
    auth:{
      user: process.env.AUTH_EMAIL,
      pass: process.env.AUTH_PASS
    }
  })

  const sentOtp = async(req,res,)=>{
    try{
      console.log("Entered into sentotp")
      const {name, email,phone, password} = req.body;

      req.session.insertData = {name, email, phone, password};
      console.log(req.session.insertData)
      req.session.storedEmail = email;
      let checkEmail= await user.findOne({email:email})
      let checkPhone= await user.findOne({phone:phone})
      console.log(checkEmail,checkPhone);
      if(checkEmail){
             return   res.render("user/register",{errmessage:"Email already exists!"});
      }else if(checkPhone){
             return   res.render("user/register",{errmessage:"Phone number already exisits!"});
      }else{
      
                const otp = generateotp();
                req.session.storedOtp = otp;
                console.log("This is the stored otp in session ", req.session.storedOtp)
                const expiryTime = 60;
                req.session.otpExpiry = Date.now() + expiryTime * 1000;
            
                console.log("generate otp: "+ otp);
                const userEmail = email;
                console.log("This is the user email: "+ userEmail);
            
                if(!userEmail){
                  return res.status(400).json({ error: "Error or invalid email"});
                }
            
                const mailOptions = {
                  from: process.env.AUTH_EMAIL,
                  to: userEmail,
                  subject: "Your OTP verification code",
                  text: `Your OTP is ${otp}`
                };
            
                transporter.sendMail(mailOptions, (error)=>{
                  if(error){
                    console.log(error);
                    return res.status(500).json({ error: "Error sending OTP email"});
                  } 
                  console.log("otp sent to the user email");     
                });
            
                req.session.otp = otp;
                res.redirect('/otp-verification');
              }    
  
    }catch(error){
      console.log(error.message);
      res.status(500).json({ error: "Internal Server Error "});
    }
  };

  const emailVerify = async (req,res)=>{
    try{
      const email  = req.body.email;
      console.log("email verify",email);
      const check = await user.findOne({email:email})
      console.log("Emailverify",check)
      if (check) {
        req.session.email= email
        req.session.forgotPassword =true
        await sentOtpForgotPword(req,res);
        res.redirect("/otp-verification");
      } else {
        res.render("user/forgotPasswordEmail", {message:"email not found"});
      }
    }
    catch(error){
      console.error("Error during email verification:", error);
      res.status(500).send("Server error");
    }
  }

  const sentOtpForgotPword = async (req, res)=>{
    try{
      const email = req.session.email;
      const otp = generateotp();
      console.log("sentOtpForgotPword",otp);
      const forgotUser = await user.findOne({email:email})
      
                req.session.otp = otp;
                console.log("This is the stored otp in session ", req.session.otp)
                const expiryTime = 60;
                req.session.otpExpiry = Date.now() + expiryTime * 1000;

                console.log("generate otp: "+ otp);

                const mailOptions = {
                  from: process.env.AUTH_EMAIL,
                  to: email,
                  subject: "Your OTP verification code",
                  text: `Your OTP is ${otp}`
                };
            
                transporter.sendMail(mailOptions, (error)=>{
                  if(error){
                    console.log(error);
                    return res.status(500).json({ error: "Error sending OTP email"});
                  } 
                  console.log("otp sent to the user email from sentOtpForgotPword");     
                });

    }catch(error){
      console.error(error)
    }
  }

  const resendOtp = async (req,res)=>{
    try{
      console.log("otp resending initiated");
      const otpResend =generateotp()
      req.session.storedotp=otpResend
      const {name,email,phone,password}=req.session.insertData
      console.log("This is the stored otp in session",req.session.storedotp);
      const expiryTime= 60
      req.session.otpExpiry=Date.now()+expiryTime*1000;

      console.log("generate otp:"+otpResend);
      const userEmail=email
      console.log("this is user email:"+userEmail);
      if(!userEmail){
          return res.status(400).json({error:"Error or invalid email"})
      }
      const mailOptions={
          from:"ananthushaji693@gmail.com",
          to:userEmail,
          subject:"Your OTP verification code",
          text: `Your OTP is ${otpResend}`
      }
      transporter.sendMail(mailOptions,(error)=>{
          if(error){
              console.log(error);
              return res.status(500).json({error:"Error sending OTP email"})
          }
          console.log("otp sent to the user email");
          
      })

      req.session.otp=otpResend
      res.redirect('/otp-verification')
  }
  catch(error){
      console.log(error.message)
  }

  }

  const verify = async (req,res)=>{
    try{
      const sendedOtp = req.session.otp;
      const verifyOtp = req.body.otp;
      console.log(sendedOtp);
      console.log(verifyOtp);
      console.log("Start Checking");
  
      if(sendedOtp === verifyOtp){
        if(Date.now()<req.session.otpExpiry){
          console.log("Otp entered before time expires");
          req.session.otpMatched = true;
          req.flash("message","successfullly registered");
          res.redirect('/')
        }
      }else{
        console.log("Failed otp verification");
        req.session.otpExpiry = false;
        req.flash("error","registration failed!");
        res.redirect('/otp-verification')
      }
    }catch(error){
      console.log(error.message);
    }
  }
  
  const doSignup = (userData, verify)=>{
    console.log("Entered in to dosignup")
    console.log(userData);
    console.log(verify)
    return new Promise(async(resolve,reject)=>{
      const userExist = await user.findOne({
        $or:[{email:userData.email},{phone:userData.phone}],
      })
      const response = {};
      console.log("hello");
      if(!userExist){
        console.log("user not exit");
        console.log(userData.password)

        if(verify){
          console.log("verify");
          try{
            const hashedPassword = await bcrypt.hash(userData.password,10);
            const userDataToSave = {
              name:userData.name,
              email: userData.email,
              phone: userData.phone,
              password: hashedPassword,
              isAdmin:0,
              isActive:true
            }
            const data = await  user.create(userDataToSave)
            response.status = true;
            response.message = "Signedup Successfully";
            resolve(response);
            console.log(data);
          }catch(error){
            console.log(error.message);
          }
        }else{
          response.status = false;
          response.message = "Enter the correct otp";
          resolve(response)
        }
      }else{
        response.status =false;
        response.message = "User already exists"
        resolve(response)
      }
    })
  }
  
  module.exports = {
    sentOtp,
    resendOtp,
    verify,
    doSignup,
    emailVerify,
    sentOtpForgotPword
  }

  