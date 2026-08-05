import { googlClient } from "../config/google.js"
import * as userRepository from "../repositery/user.repositries.js"
import { generateAccesstoken, generateRefreshtoken } from "../utils/generateToken.js"

export const googleLogin = async (token) => {
    const ticket = await googlClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload();


    if (!payload) {
        throw new Error("Invalid Google Token")
    }

    if (!payload.email) {
        throw new Error("Email not found")
    }

    if (!payload.email_verified) {
        throw new Error("Google Email is not verified")
    }

    let user = await userRepository.findByEmail(payload.email);


    if (!user) {
        user = await userRepository.create({
            name: payload.name ?? "",
            email: payload.email,
            googleId: payload.sub,
            profileImage: payload.picture,
            provider: "GOOGLE",
            password: null
        })
    }

    else if (!user.googleId) {
        user = await userRepository.updatedGoogleId(
            user.id,
            payload.sub
        )
    }

    const accessToken = generateAccesstoken(user.id)

    const refreshToken = generateRefreshtoken(user.id);

    return {
        success: true,
        message: "Login Succesfull",
        accessToken,
        refreshToken,
        user
    }
}