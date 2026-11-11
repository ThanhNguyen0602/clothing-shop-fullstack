const router = require("express").Router();
const requireAuth = require("../middlewares/requireAuth");
const { getMe, updateMe } = require("../controllers/userController");

router.use(requireAuth);

router.get("/me", getMe);
router.put("/me", updateMe);

module.exports = router;
