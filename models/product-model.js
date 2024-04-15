const mongoose = require("mongoose")

const productSchema = new mongoose.Schema({

    productName:{
        type : String,
        required : true,
    },
    productDescription:{     
        type : String,
    },
    productCategory:{
        type : mongoose.Schema.Types.ObjectId,
        ref : "category",
        required : true
    },
    productPrice:{
        type : Number,
        required : true
    },
    productQuantity:[
        {
            size:{
                type : String,
                enum : ["S","M","L"]
            },
            quantity:{
                type : Number,
                default : 0
            },
        },
    ],
    productDiscount:{
        type : Number,
        default : 0
    },
    productImage:[
        {
            type : String
        }
    ],
    productStatus:{
        type : Boolean,
        default : true
    },
    totalQuantity:{
        type: Number
    }
    
},{
    timestamps: true,
})


const product = mongoose.model('product',productSchema);
module.exports = product;