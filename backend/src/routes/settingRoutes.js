const router = require("express").Router();
const { asyncRoute } = require("../utils/catalogHelpers");
const controller = require("../controllers/adminController");

// Thong tin cua hang cong khai (ten, lien he, chinh sach) cho Footer va trang thong tin.
router.get("/", asyncRoute(controller.settings));

module.exports = router;
