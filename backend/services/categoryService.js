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

async function listAccessibleCategories(userId) {
  const result = await pool.query(
    `SELECT id, user_id, name, is_default, created_at
     FROM categories
     WHERE user_id IS NULL OR user_id = $1
     ORDER BY is_default DESC, name ASC`,
    [userId]
  );

  return result.rows.map((row) => ({
    id: Number(row.id),
    userId: row.user_id === null ? null : Number(row.user_id),
    name: row.name,
    isDefault: row.is_default,
    createdAt: row.created_at,
  }));
}

module.exports = {
  findAccessibleCategoryById,
  listAccessibleCategories,
};
