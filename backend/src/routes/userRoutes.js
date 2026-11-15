const router = require("express").Router();
const requireAuth = require("../middlewares/requireAuth");
const { getMe, updateMe, changePassword } = require("../controllers/userController");

router.use(requireAuth);

router.get("/me", getMe);
router.put("/me", updateMe);
router.put("/me/password", changePassword);

module.exports = router;
