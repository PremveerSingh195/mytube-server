import express from "express"
import { googleLogin, refreshAccessToken, register } from "../controllers/auth.controller.js"
import { login } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register" ,  register)
router.post("/login", login)
router.post("/google" , googleLogin)
router.post("/refresh" , refreshAccessToken)
export default router