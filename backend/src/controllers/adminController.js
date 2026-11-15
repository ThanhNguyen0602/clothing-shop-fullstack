const service = require("../services/adminService");
const v = require("../utils/adminValidation");
const { parseId } = require("../utils/catalogHelpers");

const actor = (req) => ({ id: req.user.id, ip: req.ip });

const listUsers = async (req, res) => {
  res.json({ success: true, data: await service.listUsers(v.userQuery(req.query)) });
};

const changeRole = async (req, res) => {
  const data = await service.changeRole(parseId(req.params.id), v.roleBody(req.body), actor(req));

  res.json({ success: true, data });
};

const changeStatus = async (req, res) => {
  const data = await service.changeStatus(parseId(req.params.id), v.statusBody(req.body),
    actor(req));

  res.json({ success: true, data });
};

const createStaff = async (req, res) => {
  const data = await service.createStaff(v.staffBody(req.body), actor(req));

  res.status(201).json({ success: true, data });
};

const settings = async (req, res) => {
  res.json({ success: true, data: await service.settings() });
};

const saveSettings = async (req, res) => {
  const data = await service.saveSettings(v.settingsBody(req.body), actor(req));

  res.json({ success: true, data });
};

module.exports = { listUsers, changeRole, changeStatus, createStaff, settings, saveSettings };
