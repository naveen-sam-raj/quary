import mongoose from "mongoose";

const treasuryLedgerSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: Date.now,
      required: true
    },
    type: {
      type: String,
      enum: {
        values: ["received_expired", "received_manual", "withdrawn"],
        message: "Type must be received_expired, received_manual, or withdrawn"
      },
      required: [true, "Ledger type is required"]
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PassBatch",
      default: null
    },
    passes: {
      type: Number,
      required: [true, "Passes count is required"],
      min: [1, "Passes must be at least 1"]
    },
    note: {
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
treasuryLedgerSchema.index({ date: -1 });
treasuryLedgerSchema.index({ type: 1 });
treasuryLedgerSchema.index({ createdAt: -1 });

// Safeguard append-only nature (disallow updates and deletes)
treasuryLedgerSchema.pre(["updateOne", "updateMany", "findOneAndUpdate", "findByIdAndUpdate"], function () {
  throw new Error("TreasuryLedger is append-only and cannot be updated.");
});

treasuryLedgerSchema.pre(["deleteOne", "deleteMany", "findOneAndDelete", "findByIdAndDelete"], function () {
  throw new Error("TreasuryLedger is append-only and cannot be deleted.");
});

export const TreasuryLedger = mongoose.model("TreasuryLedger", treasuryLedgerSchema);
