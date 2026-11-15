const router = require("express").Router();
const requireAuth = require("../middlewares/requireAuth");
const authorize = require("../middlewares/authorize");
const { asyncRoute } = require("../utils/catalogHelpers");
const controller = require("../controllers/cartController");

router.use(requireAuth, authorize("CUSTOMER"));

router.get("/", asyncRoute(controller.get));
router.post("/", asyncRoute(controller.add));
router.put("/:id", asyncRoute(controller.update));
router.delete("/:id", asyncRoute(controller.remove));
router.delete("/", asyncRoute(controller.clear));

module.exports = router;
