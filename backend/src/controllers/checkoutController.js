const service = require("../services/checkoutService");

const options = async (req, res) => {
  res.json({ success: true, data: await service.options() });
};

module.exports = { options };
