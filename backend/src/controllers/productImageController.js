const fs = require("fs");
const service = require("../services/productImageService");
const { parseId } = require("../utils/catalogHelpers");

// URL anh tuyet doi (http/https) de khop validation images cua PUT san pham buoi 04.
const origin = (req) => (process.env.PUBLIC_API_ORIGIN || `${req.protocol}://${req.get("host")}`)
  .replace(/\/$/, "");

const add = async (req, res) => {
  let id;

  try {
    id = parseId(req.params.id);
  } catch (error) {
    if (req.file) await fs.promises.unlink(req.file.path).catch(() => {});
    throw error;
  }

  const data = await service.add(id, req.file, origin(req));

  res.status(201).json({ success: true, data });
};

const remove = async (req, res) => {
  const data = await service.remove(parseId(req.params.id), parseId(req.params.imageId));

  res.json({ success: true, data });
};

const setPrimary = async (req, res) => {
  const data = await service.setPrimary(parseId(req.params.id), parseId(req.params.imageId));

  res.json({ success: true, data });
};

module.exports = { add, remove, setPrimary };
