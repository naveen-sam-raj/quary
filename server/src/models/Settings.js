import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    defaultValidityDays: {
      type: Number,
      default: 30,
      min: [1, "Default validity days must be at least 1"]
    },
    warningDays: {
      type: Number,
      default: 7,
      min: [1, "Warning days must be at least 1"]
    },
    lowStockLimit: {
      type: Number,
      default: 10,
      min: [1, "Low stock limit must be at least 1"]
    }
  },
  {
    timestamps: true
  }
);

/**
 * Returns the singleton settings document, creating default settings if none exists.
 */
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      defaultValidityDays: 30,
      warningDays: 7,
      lowStockLimit: 10
    });
  }
  return settings;
};

export const Settings = mongoose.model("Settings", settingsSchema);
