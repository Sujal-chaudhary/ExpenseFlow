//it only verify user is there or not:

import { User } from "../models/user.model.js"
import jwt from "jsonwebtoken"


export const verifyJWT = async(req,res,next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if(!token){
            return res.status(401).json({
                success: false,
                message: "Unauthorized request"
            })
        }

        console.log(token);
        

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        console.log(decodedToken);
        
        const user = await User.findById(decodedToken?._id).select("name email")
        console.log(user);
        
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
                message: error.message
            })
    }
}

