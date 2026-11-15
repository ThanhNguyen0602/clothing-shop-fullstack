const service = require("../services/cartService");
const { cartBody } = require("../utils/checkoutValidation");
const { parseId } = require("../utils/catalogHelpers");

const get = async (req, res) => {
  res.json({ success: true, data: await service.get(req.user.id) });
};

const add = async (req, res) => {
  const data = await service.save(req.user.id, cartBody(req.body, true));

  res.json({ success: true, data });
};

const update = async (req, res) => {
  const data = await service.save(req.user.id, cartBody(req.body), parseId(req.params.id));

  res.json({ success: true, data });
};

const remove = async (req, res) => {
  const data = await service.remove(req.user.id, parseId(req.params.id));

  res.json({ success: true, data });
};

const clear = async (req, res) => {
  res.json({ success: true, data: await service.remove(req.user.id) });
};

module.exports = { get, add, update, remove, clear };
