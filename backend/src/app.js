const path = require("path");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const managementRoutes = require("./routes/managementRoutes");
const brandRoutes = require("./routes/brandRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const orderWorkflowRoutes = require("./routes/orderWorkflowRoutes");
const purchaseActionRoutes = require("./routes/purchaseActionRoutes");
const addressRoutes = require("./routes/addressRoutes");
const adminRoutes = require("./routes/adminRoutes");
const settingRoutes = require("./routes/settingRoutes");

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

// Anh san pham da upload (buoi 13–14); ten file do server sinh.
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
// Anh minh hoa cho du lieu mau (seeder).
app.use("/samples", express.static(path.join(__dirname, "../public/samples")));

app.get("/", (req, res) => {
  res.json({ message: "E-commerce API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/management", managementRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/management", orderWorkflowRoutes);
app.use("/api", purchaseActionRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Không tìm thấy API" });
});

app.use(require("./middlewares/errorHandler"));

module.exports = app;
