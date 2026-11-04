const app = require("./app");
const pool = require("./config/database");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("MySQL connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

startServer();
