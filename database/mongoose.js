const mongoose = require("mongoose");
mongoose.connect(process.env.DB_URL);

mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB");
})

mongoose.connection.on("error", (err) => {
  console.log("Error connecting to MongoDB");
})

mongoose.connection.on("disconnected", () => {
  console.log("Disconnected from MongoDB");
})

module.exports=mongoose;