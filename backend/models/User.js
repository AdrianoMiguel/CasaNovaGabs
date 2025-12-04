const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  photo: String,
  isAdmin: {
    type: Boolean,
    default: false
  },
  hasChosenGift: {
    type: Boolean,
    default: false
  },
  chosenGift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gift',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);