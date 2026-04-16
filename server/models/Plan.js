const mongoose = require("mongoose");

const DaySchema = new mongoose.Schema({
  day: Number,
  morning: [String],
  afternoon: [String],
  evening: [String],
  image: String,
});

const PlanSchema = new mongoose.Schema({
  destination: { type: String, required: true },
  days: [DaySchema],
  style: String,
  interests: [String],

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Plan", PlanSchema);