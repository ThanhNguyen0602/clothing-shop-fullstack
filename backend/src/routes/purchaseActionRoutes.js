const router = require("express").Router();
const requireAuth = require("../middlewares/requireAuth");
const authorize = require("../middlewares/authorize");
const { asyncRoute } = require("../utils/catalogHelpers");
const orders = require("../controllers/orderWorkflowController");
const payments = require("../controllers/paymentController");
const reviews = require("../controllers/reviewController");

router.get("/products/:productId/reviews", asyncRoute(reviews.list));

// Gan guard tung route (khong dung router.use) vi router mount o "/api":
// router.use se bat ca duong dan khong ton tai va tra 401 thay vi 404.
const customer = [requireAuth, authorize("CUSTOMER")];

router.patch("/orders/:id/cancel", customer, asyncRoute(orders.cancel));
router.get("/orders/:id/payments", customer, asyncRoute(payments.list));
router.post("/orders/:id/payments", customer, asyncRoute(payments.create));
router.post("/products/:productId/reviews", customer, asyncRoute(reviews.create));
router.put("/reviews/:id", customer, asyncRoute(reviews.edit));
router.delete("/reviews/:id", customer, asyncRoute(reviews.remove));

module.exports = router;
