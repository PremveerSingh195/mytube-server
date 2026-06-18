import bcrypt from 'bcryptjs';
import {prisma} from "../config/prisma.js"


export const register = async (req , res) => {
    try {
        const { name , email , password } = req.body


        const existingUser = await prisma.user.findUnique({
            where : {email}
        })

        if (existingUser) {
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

        res.status(200).json(user)
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message : "Server Error"
        })
    }
}