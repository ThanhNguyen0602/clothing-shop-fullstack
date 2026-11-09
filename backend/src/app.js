const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const managementRoutes = require("./routes/managementRoutes");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "E-commerce API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/management", managementRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Không tìm thấy API" });
});

app.use(require("./middlewares/errorHandler"));

module.exports = app;
