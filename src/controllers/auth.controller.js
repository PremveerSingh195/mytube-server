import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import {
  generateAccesstoken,
  generateRefreshtoken,
} from "../utils/generateToken.js";
import * as authService from "../services/auth.service.js";
import jwt from "jsonwebtoken";
import { randomInt } from "node:crypto";
import { sendPasswordResetOtp } from "../utils/mailer.js";

const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

const formatSafeUser = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    _id: user.id,
    name: user.name,
    email: user.email,
    profileImage: user.profileImage || null,
    provider: user.provider || "LOCAL",
    channel: user.channel || null,
  };
};

const otpStore = new Map();

// Periodic cleanup of expired OTPs
setInterval(() => {
  const now = Date.now();
  for (const [email, record] of otpStore.entries()) {
    if (record.expiresAt < now) {
      otpStore.delete(email);
    }
  }
}, 15 * 60 * 1000);

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are all required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists with this email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        provider: "LOCAL",
      },
      include: {
        channel: true,
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "Failed to create user in database",
      });
    }

    const accessToken = generateAccesstoken(user.id);
    const refreshToken = generateRefreshtoken(user.id);

    if (!accessToken || !refreshToken) {
      return res.status(500).json({
        message: "Unable to generate tokens",
      });
    }

    res.cookie("refreshToken", refreshToken, getCookieOptions());

    return res.status(201).json({
      success: true,
      accessToken,
      user: formatSafeUser(user),
      message: "User created Successfully",
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        channel: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        message: "This account was registered via Google. Please sign in with Google.",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const accessToken = generateAccesstoken(user.id);
    const refreshToken = generateRefreshtoken(user.id);

    res.cookie("refreshToken", refreshToken, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: "Login Successful",
      accessToken,
      user: formatSafeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Google token is required",
      });
    }

    const response = await authService.googleLogin(token);

    res.cookie("refreshToken", response.refreshToken, getCookieOptions());

    const { refreshToken, ...safeResponse } = response;

    return res.status(200).json(safeResponse);
  } catch (error) {
    console.error("Google login error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Google authentication failed",
    });
  }
};

export const refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token not found" });
  }

  // ── 1. Verify JWT ──────────────────────────────────────────
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  // ── 2. Fetch user from DB ──────────────────────────────────
  try {
    const userId = parseInt(decoded.userId, 10);
    if (isNaN(userId)) {
      return res.status(401).json({ message: "Invalid user token payload" });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        channel: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const accessToken = generateAccesstoken(user.id);

    return res.status(200).json({
      success: true,
      user: formatSafeUser(user),
      accessToken,
    });
  } catch (error) {
    console.error("DB error in refreshAccessToken:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out Successfully",
  });
};

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(404).json({ message: "No account found with this email address" });
    }

    const otp = randomInt(1000, 10000).toString();

    console.log(otp , "fdsafsdfd");
    

    await sendPasswordResetOtp(normalizedEmail, otp);

    otpStore.set(normalizedEmail, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      verified: false,
    });

    return res.status(200).json({
      success: true,
      message: "A 4-digit code has been sent to your email",
    });
  } catch (error) {
    console.error("sendOtp error:", error);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const record = otpStore.get(normalizedEmail);

    if (!record) {
      return res.status(400).json({ message: "No OTP requested for this email" });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(normalizedEmail);
      return res.status(400).json({ message: "OTP has expired. Please request a new code" });
    }

    if (record.otp !== String(otp).trim()) {
      return res.status(400).json({ message: "Invalid OTP code" });
    }

    record.verified = true;

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("verifyOtp error:", error);
    return res.status(500).json({ message: "Failed to verify OTP" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and new password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const record = otpStore.get(normalizedEmail);

    if (!record || (otp && record.otp !== String(otp).trim())) {
      return res.status(400).json({ message: "Invalid OTP session" });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(normalizedEmail);
      return res.status(400).json({ message: "OTP has expired. Please request a new code" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        password: hashedPassword,
        provider: "LOCAL",
      },
    });

    otpStore.delete(normalizedEmail);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("resetPassword error:", error);
    return res.status(500).json({ message: "Failed to reset password" });
  }
};

export const forgotPassword = async (req, res) => {
  return sendOtp(req, res);
};
