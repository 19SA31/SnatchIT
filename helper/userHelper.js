const userModel = require('../models/user-model');
const ObjectId=require("mongoose").Types.ObjectId
const bcrypt = require('bcrypt')



const addAddressToUser = async(addressBody,userId)=>{
    try{
        console.log("This is addAddressToUser in userHelper",addressBody);
        const result= await userModel.updateOne(
            { _id:userId },
            {
                $push:{ address:addressBody },
            }
        );
        return result;
    }catch(error){
        throw error
    };
}

const updateUserDetails = (userId,userDetails)=>{
    return new Promise(async (resolve, reject) => {
        const user = await userModel.findById(new ObjectId(userId));
    
        let response = {};
        if (user) {
          if (user.isActive) {
            const success = await bcrypt.compare(
              userDetails.password,
              user.password
            );
    
            if (success) {
              if (userDetails.name) {
                user.name = userDetails.name;
              }
              if (userDetails.email) {
                user.email = userDetails.email;
              }
              if (userDetails.phone) {
                user.phone = userDetails.phone;
              }
              
              await user.save();
              response.status = true;
              resolve(response);
            } else {
              response.message = "Incorrect Password";
              resolve(response);
            }
          }
        }
      });
}




const updateUserPassword = async (userId, passwordDetails) => {
  return new Promise(async (resolve, reject) => {
    const user = await userModel.findById(new ObjectId(userId));
    console.log(user, "this is password helper");
    console.log(passwordDetails);
    let response = {};
    if (user) {
      if (user.isActive) {
        if (typeof passwordDetails.oldPassword === 'string' && typeof user.password === 'string') {
          const success = await bcrypt.compare(passwordDetails.oldPassword, user.password);
          if (success) {
            if (
              passwordDetails.newPassword &&
              passwordDetails.newPassword === passwordDetails.confirmPassword
            ) {
              user.password = await bcrypt.hash(passwordDetails.newPassword, 10);
              await user.save();
              response.status = true;
              resolve(response);
            }
          } else {
            response.message = "Incorrect Password";
            resolve(response);
          }
        } else {
          response.message = "Invalid input data format";
          resolve(response);
        }
      }
    }
  });
};

const editAddressHelper = async(userId,addressId,body)=>{
    try {
        console.log("entered into editAddress in userHelper");
        const result = await userModel.updateOne(
            { _id:new ObjectId(userId), 'address._id': new ObjectId(addressId)},
            {$set:{ 'address.$':body }}        
        )
        console.log(result);
        return result
    } catch (error) {
        console.log(error);
    }
}

const deleteAddressHelper = async (userId,addressId)=>{
    try{
        console.log("entered into deletedAddress helper");
        const result = await userModel.updateOne(
            { _id:userId},
            { $pull: { address:{ _id:addressId } } }
        )
        if(result){
            return result;
        }
    }catch(error){
        console.log(error);
    }
}

const getWalletDetails = async (userId) => {
  return new Promise(async (resolve, reject) => {
    const result = await userModel.findOne({ _id: userId });

    if (result) {
      resolve(result);
    } else {
      console.log("not found");
    }
  });
};

module.exports={
    addAddressToUser,
    updateUserDetails,
    updateUserPassword,
    editAddressHelper,
    deleteAddressHelper,
    getWalletDetails

}