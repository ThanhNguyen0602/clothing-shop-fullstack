const pool = require("../config/database");
const products = require("../models/productSearchModel");

const search = async (query) => {
  const db = await pool.getConnection();

  try {
    await db.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    await db.beginTransaction();

    const { rows, total } = await products.search(db, query);
    const totalPages = Math.ceil(total / query.limit);

    await db.commit();

    return {
      data: rows,
      pagination: {
        page: query.page, limit: query.limit, total, totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1 && query.page <= totalPages
      }
    };
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    db.release();
  }
};

module.exports = { search };
