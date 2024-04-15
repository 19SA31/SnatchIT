const categoryModel = require("../models/category-model");

const addCat = (productName, productDescription) => {
    try {
        return new Promise(async (resolve, reject) => {
            const checkCat = await categoryModel.findOne({ name: { $regex: new RegExp(productName, 'i') } });
            if(!checkCat){
            const category = await categoryModel.updateOne({ name: productName }, {
                $set: {
                    name: productName, description: productDescription
                }
            }, { upsert: true });
            resolve({ status: true ,message: "Category Added"});
            
            } else {
                resolve({ status: false, message: "Category Already Exists" });
            }
        }
    )
    } catch (error) {
        console.log(error)
    }
}

const modalLoader= async(req,res)=>{
    try {
        const id = req.params.id
        const catData = await categoryModel.findById(id);
        console.log(catData);
        res.json({catData})
    } catch (error) {
        console.log(error)
    }
  }

  const editedSave = async(req,res)=>{
    try {

        const { editId, editName, editDescription } = req.body;
        console.log(editId,editName,editDescription);
        
        const checkCat = await categoryModel.findOne({ 
            _id: { $ne: editId },
            name: { $eq: editName } 
        });
        if(!checkCat){
            const updatedCategory = await categoryModel.findByIdAndUpdate(
                editId,
                { name: editName, description: editDescription },
    
            );
            
            if (!updatedCategory) {
                return res.status(404).json({ error: 'Category not found' });
            }else{
                res.status(200).json({ message: 'Category updated successfully', updatedCategory });
            }
        }else{
            return res.status(200).json({ message: 'Category already exists' });
        }

        
    } catch (error) {
        console.log(error);
    }
  }

  const getAllcategory = () => {
    return new Promise(async (resolve, reject) => {
      await categoryModel.find().then((result) => {
        resolve(result);
      });
    });
  };

  const getAllActiveCategory = () => {
    return new Promise(async (resolve, reject) => {
      try {
        const categories = await categoryModel.find({ isListed: true });
        if (categories) {
          resolve(categories);
        } else {
          resolve({ message: "No Active Categories" });
        }
      } catch (error) {
        console.log(error);
      }
    });
  };



module.exports = {
    addCat,
    modalLoader,
    editedSave,
    getAllcategory,
    getAllActiveCategory
}