const router = require("express").Router();
const requireAuth = require("../middlewares/requireAuth");
const authorize = require("../middlewares/authorize");
const { asyncRoute } = require("../utils/catalogHelpers");
const orders = require("../controllers/orderWorkflowController");
const payments = require("../controllers/paymentController");
const reviews = require("../controllers/reviewController");

router.use(requireAuth, authorize("MANAGER", "ADMIN"));

router.get("/orders", asyncRoute(orders.list));
router.get("/orders/:id", asyncRoute(orders.detail));
router.patch("/orders/:id/status", asyncRoute(orders.change));
router.patch("/orders/:id/cancel", asyncRoute(orders.cancel));
router.post("/orders/:id/collect-cod", asyncRoute(payments.collectCod));
router.post("/orders/:id/simulate-payment", asyncRoute(payments.simulate));
router.get("/reviews", asyncRoute(reviews.management));
router.patch("/reviews/:id/status", asyncRoute(reviews.moderate));

module.exports = router;
