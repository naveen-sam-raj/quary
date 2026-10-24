/**
 * Standard API response helper
 * Ensures consistent response contract across all endpoints: { success, data, message }
 */
export const sendResponse = (res, statusCode, { success, data = null, message = "", ...extra }) => {
  return res.status(statusCode).json({
    success,
    data,
    message,
    ...extra
  });
};

export const sendSuccess = (res, data = null, message = "Success", statusCode = 200, extra = {}) => {
  return sendResponse(res, statusCode, {
    success: true,
    data,
    message,
    ...extra
  });
};

export const sendError = (res, message = "An error occurred", statusCode = 500, data = null) => {
  return sendResponse(res, statusCode, {
    success: false,
    data,
    message
  });
};
