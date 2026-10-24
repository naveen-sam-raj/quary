import { Settings } from "../models/Settings.js";
import { sendSuccess } from "../utils/response.js";

/**
 * GET /api/settings
 * Authenticated users
 */
export const getSettings = async (req, res) => {
  const settings = await Settings.getSettings();
  return sendSuccess(res, { settings }, "Settings retrieved successfully");
};

/**
 * PUT /api/settings
 * Admin only
 */
export const updateSettings = async (req, res) => {
  const updates = req.body;
  let settings = await Settings.findOne();

  if (!settings) {
    settings = await Settings.create(updates);
  } else {
    Object.assign(settings, updates);
    await settings.save();
  }

  return sendSuccess(res, { settings }, "Settings updated successfully");
};
