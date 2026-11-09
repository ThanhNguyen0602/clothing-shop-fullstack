const router = require("express").Router();
const categories = require("../controllers/categoryController");
const products = require("../controllers/productController");
const requireAuth = require("../middlewares/requireAuth");
const authorize = require("../middlewares/authorize");
const { asyncRoute } = require("../utils/catalogHelpers");

router.use(requireAuth, authorize("MANAGER", "ADMIN"));

router.get("/categories", asyncRoute(categories.listManagement));
router.get("/products", asyncRoute(products.listManagement));
router.get("/products/:id", asyncRoute(products.detailManagement));

module.exports = router;
