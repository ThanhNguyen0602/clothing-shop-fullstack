const model = require("../models/dashboardModel");
const withTransaction = require("../utils/withTransaction");

const LOW_STOCK = 5;

// Doanh thu chi tinh don COMPLETED; cac so lieu doc trong cung mot snapshot REPEATABLE READ.
const stats = () => withTransaction((db) => model.stats(db, LOW_STOCK));

module.exports = { stats };
