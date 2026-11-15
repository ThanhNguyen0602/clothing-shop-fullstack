const router = require("express").Router();
const controller = require("../controllers/productController");
const images = require("../controllers/productImageController");
const requireAuth = require("../middlewares/requireAuth");
const authorize = require("../middlewares/authorize");
const { uploadProductImage } = require("../middlewares/upload");
const { asyncRoute } = require("../utils/catalogHelpers");

// Gan guard cho tung route ghi (khong dung router.use) de cac duong dan con
// khac nhu /api/products/:productId/reviews (buoi 07) di tiep sang router sau.
const manage = [requireAuth, authorize("MANAGER", "ADMIN")];

router.get("/", asyncRoute(controller.listPublic));
router.get("/:id", asyncRoute(controller.detail));

router.post("/", ...manage, asyncRoute(controller.create));
router.put("/:id", ...manage, asyncRoute(controller.update));
router.patch("/:id/status", ...manage, asyncRoute(controller.changeStatus));
router.delete("/:id", ...manage, asyncRoute(controller.remove));

router.post("/:id/variants", ...manage, asyncRoute(controller.addVariant));
router.put("/:id/variants/:variantId", ...manage, asyncRoute(controller.updateVariant));
router.delete("/:id/variants/:variantId", ...manage, asyncRoute(controller.removeVariant));

router.post("/:id/images", ...manage, uploadProductImage, asyncRoute(images.add));
router.patch("/:id/images/:imageId/primary", ...manage, asyncRoute(images.setPrimary));
router.delete("/:id/images/:imageId", ...manage, asyncRoute(images.remove));

module.exports = router;
