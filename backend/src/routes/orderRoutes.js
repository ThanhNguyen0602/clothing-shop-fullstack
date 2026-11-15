const router = require("express").Router();
const requireAuth = require("../middlewares/requireAuth");
const authorize = require("../middlewares/authorize");
const { asyncRoute } = require("../utils/catalogHelpers");
const controller = require("../controllers/orderController");

router.use(requireAuth, authorize("CUSTOMER"));

router.post("/", asyncRoute(controller.create));
router.get("/my-orders", asyncRoute(controller.mine));
router.get("/:id", asyncRoute(controller.detail));

module.exports = router;
