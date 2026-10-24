import mongoose from "mongoose";

const agentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Agent name is required"],
      trim: true
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true
    },
    company: {
      type: String,
      trim: true,
      default: ""
    },
    location: {
      type: String,
      trim: true,
      default: ""
    },
    commission: {
      type: Number,
      default: 0,
      min: [0, "Commission cannot be negative"]
    },
    openingBalance: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: {
        values: ["active", "inactive"],
        message: "Status must be either active or inactive"
      },
      default: "active"
    },
    notes: {
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
agentSchema.index({ phone: 1 });
agentSchema.index({ name: 1 });
agentSchema.index({ company: 1 });
agentSchema.index({ status: 1 });
agentSchema.index({ isDeleted: 1, createdAt: -1 });

export const Agent = mongoose.model("Agent", agentSchema);
