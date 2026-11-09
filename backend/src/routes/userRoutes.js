const router = require("express").Router();
const requireAuth = require("../middlewares/requireAuth");
const authorize = require("../middlewares/authorize");
const { getMe, updateMe } = require("../controllers/userController");

router.use(requireAuth);

router.get("/me", getMe);
router.put("/me", updateMe);

// TAM THOI: chi de thuc hanh buoi 03, xoa sau khi kiem thu.
router.get("/role-check", authorize("MANAGER", "ADMIN"), (req, res) => {
  res.json({ success: true, data: { role: req.user.role } });
});

module.exports = router;
