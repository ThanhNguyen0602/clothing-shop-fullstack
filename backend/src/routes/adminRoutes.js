const router = require("express").Router();
const requireAuth = require("../middlewares/requireAuth");
const authorize = require("../middlewares/authorize");
const { asyncRoute } = require("../utils/catalogHelpers");
const controller = require("../controllers/adminController");

router.use(requireAuth, authorize("ADMIN"));

router.get("/users", asyncRoute(controller.listUsers));
router.post("/users", asyncRoute(controller.createStaff));
router.patch("/users/:id/role", asyncRoute(controller.changeRole));
router.patch("/users/:id/status", asyncRoute(controller.changeStatus));
router.get("/settings", asyncRoute(controller.settings));
router.put("/settings", asyncRoute(controller.saveSettings));

module.exports = router;
