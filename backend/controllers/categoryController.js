const pool = require("../db");

function normalizeCategoryName(name) {
  return String(name).trim().replace(/\s+/g, " ");
}

function mapCategoryRow(row) {
  return {
    id: Number(row.id),
    userId: row.user_id === null ? null : Number(row.user_id),
    name: row.name,
    isDefault: row.is_default,
    createdAt: row.created_at,
  };
}

async function getCategories(req, res) {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT id, user_id, name, is_default, created_at
       FROM categories
       WHERE user_id IS NULL OR user_id = $1
       ORDER BY is_default DESC, name ASC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      categories: result.rows.map(mapCategoryRow),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
}

async function createCategory(req, res) {
  const userId = req.user.userId;
  const { name } = req.body || {};

  if (!name || !String(name).trim()) {
    return res.status(400).json({
      success: false,
      message: "Category name is required",
    });
  }

  const normalizedName = normalizeCategoryName(name);

  if (normalizedName.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Category name must be 100 characters or fewer",
    });
  }

  try {
    const existingCategoryResult = await pool.query(
      `SELECT id, user_id, is_default
       FROM categories
       WHERE LOWER(name) = LOWER($1)
         AND (user_id IS NULL OR user_id = $2)
       LIMIT 1`,
      [normalizedName, userId]
    );

    if (existingCategoryResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "A category with this name already exists",
      });
    }

    const insertResult = await pool.query(
      `INSERT INTO categories (user_id, name, is_default)
       VALUES ($1, $2, FALSE)
       RETURNING id, user_id, name, is_default, created_at`,
      [userId, normalizedName]
    );

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      category: mapCategoryRow(insertResult.rows[0]),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create category",
    });
  }
}

module.exports = {
  getCategories,
  createCategory,
};
