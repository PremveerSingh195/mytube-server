import express from "express"
import authRoutes from "./routes/auth.routes.js"

const app = express()

app.use(express.json());


app.get("/" , (req, res ) => {
    res.send("API running")
})

app.get("/api/auth" , authRoutes)

export default app