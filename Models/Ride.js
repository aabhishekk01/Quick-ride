import mongoose from "mongoose";

const rideSchema = new mongoose.Schema({
  destination: String,
  distance: Number,
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now },
});

export const Ride = mongoose.model("Ride", rideSchema);
