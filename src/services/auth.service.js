import { googlClient } from "../config/google.js"
import * as userRepository from "../repositery/user.repositries.js"
import { generateAccesstoken, generateRefreshtoken } from "../utils/generateToken.js"

export const googleLogin = async (token) => {
    const ticket = await googlClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (!payload) {
        throw new Error("Invalid Google Token");
    }

    if (!payload.email) {
        throw new Error("Email not found in Google Token");
    }

    if (!payload.email_verified) {
        throw new Error("Google Email is not verified");
    }

    const email = payload.email.trim().toLowerCase();
    let user = await userRepository.findByEmail(email);

    if (!user) {
        user = await userRepository.create({
            name: payload.name ?? "",
            email,
            googleId: payload.sub,
            profileImage: payload.picture,
            provider: "GOOGLE",
            password: null
        });
    } else if (!user.googleId) {
        user = await userRepository.updatedGoogleId(
            user.id,
            payload.sub
        );
    }

    const accessToken = generateAccesstoken(user.id);
    const refreshToken = generateRefreshtoken(user.id);

    const { password: _, ...safeUser } = user;

    return {
        success: true,
        message: "Login Successful",
        accessToken,
        refreshToken,
        user: {
            id: safeUser.id,
            _id: safeUser.id,
            name: safeUser.name,
            email: safeUser.email,
            profileImage: safeUser.profileImage,
            provider: safeUser.provider,
            channel: safeUser.channel || null,
        }
    };
};