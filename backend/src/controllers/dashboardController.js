const service = require("../services/dashboardService");

const stats = async (req, res) => {
  res.json({ success: true, data: await service.stats() });
};

module.exports = { stats };
