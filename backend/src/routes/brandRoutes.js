const router = require("express").Router();
const { listPublic } = require("../controllers/brandController");
const { asyncRoute } = require("../utils/catalogHelpers");

router.get("/", asyncRoute(listPublic));

module.exports = router;
