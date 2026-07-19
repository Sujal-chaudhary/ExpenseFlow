//it only verify user is there or not:

import { User } from "../models/user.model.js"
import jwt from "jsonwebtoken"


export const verifyJWT = async(req,res) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("bearer", "")
        if(!token){
            return res.status(401).json({
                success: false,
                message: "Unauthorized request"
            })
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select("name email")
        if(!user){
            return res.status(401).json({
                success: false,
                message: "Invalid access token"
            })
        }

        req.user = user //added an obj in req body
        next();
    } catch (error) {
         return res.status(401).json({
                success: false,
                message: "Invalid access token"
            })
    }
}

