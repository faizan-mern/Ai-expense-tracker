const pool = require("../db");

async function findAccessibleCategoryById(categoryId, userId) {
  const result = await pool.query(
    `SELECT id, name, is_default, user_id
     FROM categories
     WHERE id = $1
       AND (user_id IS NULL OR user_id = $2)`,
    [categoryId, userId]
  );

  return result.rows[0] || null;
}

module.exports = {
  findAccessibleCategoryById,
};
