const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User=require("./user")
main().catch(err => console.log(err));

async function main() {
  await mongoose.connect(process.env.MONGOURL);

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

const order = new Schema({
  items:[{productId:String,quantity:String,price:String}],
  total:String,
  owner:{
    type: mongoose.Schema.Types.ObjectId, // Storing an ObjectId
    ref: 'User', // Refers to the User model
    required: true
  }
});

let NewOrder=mongoose.model('NewOrder',order)
module.exports=NewOrder;

