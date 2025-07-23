const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  id: String,
  date: Date,
  items: [
    {
      productId: String,
      name: String,
      qty: Number,
      priceOut: Number,
      priceIn: Number
    }
  ],
  paymentMethod: String,
  orderNo: String
});

module.exports = mongoose.model('Sale', saleSchema);