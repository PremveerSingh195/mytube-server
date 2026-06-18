import jwt from "jsonwebtoken"

export const generateAccesstoken = (userId) => {
      return jwt.sign(
        {userId} ,
          process.env.ACCESS_TOKEN_SECRET,
          {
            expiresIn : "15m"
          }
      )
} 

export const generateRefreshtoken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: "7d"
        }
    )
} 