import express from "express";
import {
  register,
  login,
  googleLogin,
  logout,
  refreshAccessToken,
  sendOtp,
  verifyOtp,
  resetPassword,
  forgotPassword,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/logout", logout);
router.post("/refresh", refreshAccessToken);
router.post("/sendOtp", sendOtp);
router.post("/verifyOtp", verifyOtp);
router.post("/resetPassword", resetPassword);
router.post("/forgotPassword", forgotPassword);

export default router;