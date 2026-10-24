import mongoose from "mongoose";

export const PURCHASE_CATEGORIES = [
  "JCB",
  "Food",
  "Machinery",
  "Diesel",
  "Blasting",
  "Other"
];

const purchaseSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, "Purchase date is required"],
      index: true
    },
    category: {
      type: String,
      required: [true, "Purchase category is required"],
      enum: {
        values: PURCHASE_CATEGORIES,
        message: "Category must be one of: JCB, Food, Machinery, Diesel, Blasting, Other"
      },
      index: true
    },
    vendor: {
      type: String,
      required: [true, "Vendor name is required"],
      trim: true
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"]
    },
    notes: {
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
purchaseSchema.index({ date: -1 });
purchaseSchema.index({ category: 1, date: -1 });
purchaseSchema.index({ vendor: 1 });

export const Purchase = mongoose.model("Purchase", purchaseSchema);
