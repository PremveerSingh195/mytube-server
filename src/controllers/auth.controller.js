import bcrypt from 'bcryptjs';
import {prisma} from "../config/prisma.js"
import { generateAccesstoken, generateRefreshtoken } from '../utils/generateToken.js';


export const register = async (req , res) => {

    try {
        const { name , email , password } = req.body

        // if (!name | !email | !password) {
        //     return res.status(400).json({
        //         message: "all three needed name , email , password",
        //     })
        // }


        const existingUser = await prisma.user.findUnique({
            where : {email}
        })

        if (!existingUser) {
            return res.status(400).json({
                message : "User already exist"
            })
        }

        const hashedPassword = await bcrypt.hash(password , 10)

        const user = await prisma.user.create({
            data : {
                name ,
                email ,
                password : hashedPassword
            }
        })

        // if (!user) {
        //     return res.status(400).json({
        //         message: "failed to add user to database"
        //     })
        // }

        const accessToken = generateAccesstoken(user.id)
        const resfreshToken = generateRefreshtoken(user.id)

        // if (!!accessToken && !!resfreshToken) {
        //     return res.status(400).json({
        //         message: "unable to generate token"
        //     })
        // }


        res.cookie(
            "refreshToken",
            resfreshToken,
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge:
                    7 * 24 * 60 * 60 * 1000
            }
        )

        res.status(200).json({
            user,
            accessToken,
            message: "User Signup Successfull",
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: "Server Error"
        })
    }
}

export const login = async (req, res) => {
    try {

        console.log(req, "fdsagfdsgdfsgsd");


        const { email, password } = req.body

        console.log(email, "fdsgdfsgfds");


        const user = await prisma.user.findUnique({
            where: { email },
        })




        if (!user) {
            res.status(401).json({
                message: "User not found"
            })
        }

        const match = await bcrypt.compare(password, user.password)

        if (!match) {
            res.status(401).json({
                message: "wrong Password"
            })
        }


        const accessToken = generateAccesstoken(user.id)
        const resfreshToken = generateRefreshtoken(user.id)

        console.log("dfgsgsdsxfdafjhfgshdj");

        res.cookie(
            "refreshToken",
            resfreshToken,
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge:
                    7 * 24 * 60 * 60 * 1000
            }
        )

        console.log(accessToken, resfreshToken, "fdsgagffdsgdfsgfdsgds");


        return res.status(200).json({
            success: true,
            message: "Login Successfull",
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        })

    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: "internal server Error"
        })
    }
}