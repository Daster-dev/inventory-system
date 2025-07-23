const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: String,
  name: String,
  category: String,
  priceIn: Number,
  priceOut: Number,
  qty: Number,
  expiryDate: String,
  imgPath: String,
  lastSold: Date
});

module.exports = mongoose.model('Product', productSchema);