import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import {
  generateAccesstoken,
  generateRefreshtoken,
} from "../utils/generateToken.js";
import * as authService from "../services/auth.service.js";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "all three needed name , email , password",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exist",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "failed to add user to database",
      });
    }

    const accessToken = generateAccesstoken(user.id);
    const resfreshToken = generateRefreshtoken(user.id);

    if (!accessToken || !resfreshToken) {
      return res.status(400).json({
        message: "unable to generate token",
      });
    }

    res.cookie("refreshToken", resfreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password: _, ...safeuser } = user;

    res.cookie("refreshToken", resfreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      accessToken,
      user: safeuser,
      message: "User created Successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
      error,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({
        message: "User not found",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      res.status(401).json({
        message: "wrong Password",
      });
    }

    const accessToken = generateAccesstoken(user.id);
    const resfreshToken = generateRefreshtoken(user.id);

    res.cookie("refreshToken", resfreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login Successfull",
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        channel: user.channel
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "internal server Error",
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

    res.cookie("refreshToken", response.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 31 * 7 * 24 * 60 * 60 * 1000,
    });

    console.log(response , "fdasjfhgdsjhg");
    

    const { refreshToken, ...safeResponse } = response;

    return res.status(200).json(safeResponse);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

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
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(decoded.userId), // make sure type matches your schema
      },
      select: {
        id: true,
        name: true,
        email: true,
        channel : true
      },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const accessToken = generateAccesstoken(user.id);

    return res.status(200).json({
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
        channel : user.channel
      },
      accessToken,
    });
  } catch (error) {
    console.error("DB error:", error); // full error object
    console.error("Decoded JWT:", decoded); // see what id looks like
    console.error("ID type:", typeof decoded.id, "| Value:", decoded.id);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req , res) => {
    res.clearCookie("token" , {
      httpOnly : true,
      secure: process.env.NODE_ENV === "production",
      sameSite : "lax"
    })

    res.json({
      message : "Logged out Successfully"
    })
}

export const forgotPassword = async (req , res) => {
  res.json({
    message : "endpoint working"
  })
}
