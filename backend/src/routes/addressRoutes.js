const router = require("express").Router();
const requireAuth = require("../middlewares/requireAuth");
const authorize = require("../middlewares/authorize");
const { asyncRoute } = require("../utils/catalogHelpers");
const controller = require("../controllers/addressController");

router.use(requireAuth, authorize("CUSTOMER"));

router.get("/", asyncRoute(controller.list));
router.post("/", asyncRoute(controller.create));
router.put("/:id", asyncRoute(controller.update));
router.patch("/:id/default", asyncRoute(controller.setDefault));
router.delete("/:id", asyncRoute(controller.remove));

module.exports = router;
