import mongoose from "mongoose";

const subBuyerSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: [true, "Associated agent ID is required"],
      index: true
    },
    name: {
      type: String,
      required: [true, "Sub-buyer name is required"],
      trim: true
    },
    phone: {
      type: String,
      trim: true,
      default: ""
    },
    location: {
      type: String,
      trim: true,
      default: ""
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Indexes
subBuyerSchema.index({ agentId: 1, isDeleted: 1 });
subBuyerSchema.index({ name: 1 });
subBuyerSchema.index({ isDeleted: 1 });

export const SubBuyer = mongoose.model("SubBuyer", subBuyerSchema);
