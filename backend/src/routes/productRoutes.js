const router = require("express").Router();
const controller = require("../controllers/productController");
const requireAuth = require("../middlewares/requireAuth");
const authorize = require("../middlewares/authorize");
const { asyncRoute } = require("../utils/catalogHelpers");

router.get("/", asyncRoute(controller.listPublic));
router.get("/:id", asyncRoute(controller.detail));

router.use(requireAuth, authorize("MANAGER", "ADMIN"));

router.post("/", asyncRoute(controller.create));
router.put("/:id", asyncRoute(controller.update));
router.patch("/:id/status", asyncRoute(controller.changeStatus));
router.delete("/:id", asyncRoute(controller.remove));

module.exports = router;
