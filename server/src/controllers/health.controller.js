/**
 * Health check endpoint for uptime monitors (e.g. UptimeRobot)
 * GET /api/health -> { success: true, status: "ok", time }
 */
export const getHealth = (req, res) => {
  const currentTime = new Date().toISOString();

  return res.status(200).json({
    success: true,
    status: "ok",
    time: currentTime,
    data: {
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || "development"
    },
    message: "Server is healthy and operational"
  });
};
