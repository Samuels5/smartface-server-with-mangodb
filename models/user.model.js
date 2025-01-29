const mongoose = require("mongoose")

const UserSchema = mongoose.Schema(
  {
    name: {
      type: String,
      requied: [true, "please enter your name"],
    },
    email: {
      type: String,
      unique: true,
      requied: true,
    },
    entries: {
      type: Number,
      default: 0,
      requied: false,
    },
    hash: {
      type: String,
      requied: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);

module.exports = User