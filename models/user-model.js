const mongoose = require('mongoose')

const userSchema =new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    phone:{
        type:Number,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    address: [
        {
          housename: String,
          streetname:String,
          areaname:String,
          districtname:String,
          statename: String,
          countryname: String,
          pin: Number,
        },
    ],
    isAdmin:{
        type:Number,
        required:true
    },
    isActive:{
        type:Boolean,
        required:true
    }

})

const User = mongoose.model('User',userSchema)

module.exports = User
