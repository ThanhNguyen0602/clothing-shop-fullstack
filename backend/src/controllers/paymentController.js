const service = require("../services/paymentService");
const v = require("../utils/workflowValidation");
const { parseId } = require("../utils/catalogHelpers");

const list = async (req, res) => {
  const data = await service.list(parseId(req.params.id), req.user.id);

  res.json({ success: true, data });
};

const create = async (req, res) => {
  v.object(req.body, []);

  const data = await service.create(parseId(req.params.id), req.user.id);

  res.json({ success: true, data });
};

const simulate = async (req, res) => {
  v.object(req.body, ["transaction_code", "status"]);

  const data = await service.simulate(parseId(req.params.id),
    v.text(req.body.transaction_code, 255),
    v.choice(req.body.status, ["SUCCESS", "FAILED"]), req.user.id);

  res.json({ success: true, data });
};

const collectCod = async (req, res) => {
  v.object(req.body, []);

  const data = await service.collectCod(parseId(req.params.id));

  res.json({ success: true, data });
};

module.exports = { list, create, simulate, collectCod };
