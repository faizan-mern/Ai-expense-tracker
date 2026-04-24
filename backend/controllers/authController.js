const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
require("../config/env");

function createToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

async function register(req, res) {
  const { fullName, email, password } = req.body;
  const normalizedFullName = String(fullName || "").trim();

  if (!normalizedFullName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Full name, email, and password are required",
    });
  }

  const normalizedEmail = normalizeEmail(String(email));
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

  if (!isValidEmail) {
    return res.status(400).json({
      success: false,
      message: "Email must be a valid email address",
    });
  }

  if (normalizedFullName.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Full name must be 100 characters or fewer",
    });
  }

  if (password.length > 72) {
    return res.status(400).json({
      success: false,
      message: "Password must be 72 characters or fewer",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long",
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const insertUserResult = await pool.query(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, full_name, email, created_at`,
      [normalizedFullName, normalizedEmail, passwordHash]
    );

    if (insertUserResult.rows.length === 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const user = insertUserResult.rows[0];
    const token = createToken(user);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: Number(user.id),
        fullName: user.full_name,
        email: user.email,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to register user",
    });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  const normalizedEmail = normalizeEmail(email);

  try {
    const userResult = await pool.query(
      `SELECT id, full_name, email, password_hash, created_at
       FROM users
       WHERE email = $1`,
      [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = userResult.rows[0];
    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: Number(user.id),
        fullName: user.full_name,
        email: user.email,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to log in",
    });
  }
}

async function getCurrentUser(req, res) {
  try {
    const userResult = await pool.query(
      `SELECT id, full_name, email, created_at
       FROM users
       WHERE id = $1`,
      [req.user.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userResult.rows[0];

    return res.status(200).json({
      success: true,
      user: {
        id: Number(user.id),
        fullName: user.full_name,
        email: user.email,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
    });
  }
}

module.exports = {
  register,
  login,
  getCurrentUser,
};
