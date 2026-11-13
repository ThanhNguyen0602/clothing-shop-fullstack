const service = require("../services/brandService");

const listPublic = async (req, res) => {
  res.json({ success: true, data: await service.listPublic() });
};

module.exports = { listPublic };
