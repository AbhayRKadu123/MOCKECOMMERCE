const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('dotenv').config();

const passportLocalMongoose = require('passport-local-mongoose');
main().catch(err => console.log(err));

async function main() {
  await mongoose.connect(process.env.MONGOURL);

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}
const User = new Schema({
  email:String
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);