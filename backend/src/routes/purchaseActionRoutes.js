const router = require("express").Router();
const requireAuth = require("../middlewares/requireAuth");
const authorize = require("../middlewares/authorize");
const { asyncRoute } = require("../utils/catalogHelpers");
const orders = require("../controllers/orderWorkflowController");
const payments = require("../controllers/paymentController");
const reviews = require("../controllers/reviewController");

router.get("/products/:productId/reviews", asyncRoute(reviews.list));

router.use(requireAuth, authorize("CUSTOMER"));

router.patch("/orders/:id/cancel", asyncRoute(orders.cancel));
router.get("/orders/:id/payments", asyncRoute(payments.list));
router.post("/orders/:id/payments", asyncRoute(payments.create));
router.post("/products/:productId/reviews", asyncRoute(reviews.create));
router.put("/reviews/:id", asyncRoute(reviews.edit));
router.delete("/reviews/:id", asyncRoute(reviews.remove));

module.exports = router;
