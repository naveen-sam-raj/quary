import mongoose from "mongoose";

const passBatchSchema = new mongoose.Schema(
  {
    batchNo: {
      type: String,
      required: [true, "Batch number is required"],
      unique: true,
      trim: true
    },
    source: {
      type: String,
      enum: {
        values: ["govt", "treasury"],
        message: "Source must be either govt or treasury"
      },
      required: [true, "Source is required"],
      default: "govt"
    },
    totalPasses: {
      type: Number,
      required: [true, "Total passes is required"],
      min: [1, "Total passes must be at least 1"]
    },
    usedPasses: {
      type: Number,
      default: 0,
      min: [0, "Used passes cannot be negative"]
    },
    returnedToTreasury: {
      type: Number,
      default: 0,
      min: [0, "Returned to treasury cannot be negative"]
    },
    issueDate: {
      type: Date,
      required: [true, "Issue date is required"]
    },
    validityDays: {
      type: Number,
      default: null
    },
    validTill: {
      type: Date,
      default: null
    },
    feePerPass: {
      type: Number,
      default: 0,
      min: [0, "Fee per pass cannot be negative"]
    },
    status: {
      type: String,
      enum: {
        values: ["active", "returned", "exhausted"],
        message: "Status must be active, returned, or exhausted"
      },
      default: "active"
    },
    note: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

// Indexes
passBatchSchema.index({ source: 1, status: 1 });
passBatchSchema.index({ validTill: 1 });
passBatchSchema.index({ createdAt: 1 });

export const PassBatch = mongoose.model("PassBatch", passBatchSchema);
