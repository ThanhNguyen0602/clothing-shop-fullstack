const service = require("../services/addressService");
const { addressBody } = require("../utils/addressValidation");
const { parseId } = require("../utils/catalogHelpers");

const list = async (req, res) => {
  res.json({ success: true, data: await service.list(req.user.id) });
};

const create = async (req, res) => {
  const data = await service.create(req.user.id, addressBody(req.body));

  res.status(201).json({ success: true, data });
};

const update = async (req, res) => {
  const data = await service.update(req.user.id, parseId(req.params.id), addressBody(req.body));

  res.json({ success: true, data });
};

const setDefault = async (req, res) => {
  const data = await service.setDefault(req.user.id, parseId(req.params.id));

  res.json({ success: true, data });
};

const remove = async (req, res) => {
  const data = await service.remove(req.user.id, parseId(req.params.id));

  res.json({ success: true, data });
};

module.exports = { list, create, update, setDefault, remove };
