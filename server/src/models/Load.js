import mongoose from "mongoose";

const loadSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, "Date is required"]
    },
    lorryNo: {
      type: String,
      required: [true, "Lorry number is required"],
      trim: true
    },
    material: {
      type: String,
      required: [true, "Material is required"],
      trim: true
    },
    quantity: {
      type: Number,
      default: 0,
      min: [0, "Quantity cannot be negative"]
    },
    rate: {
      type: Number,
      default: 0,
      min: [0, "Rate cannot be negative"]
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"]
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: [true, "Agent is required"]
    },
    subBuyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubBuyer",
      default: null
    },
    passBatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PassBatch",
      required: [true, "Pass batch ID is required"]
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes
loadSchema.index({ date: -1 });
loadSchema.index({ agentId: 1 });
loadSchema.index({ subBuyerId: 1 });
loadSchema.index({ passBatchId: 1 });
loadSchema.index({ createdAt: -1 });

export const Load = mongoose.model("Load", loadSchema);
