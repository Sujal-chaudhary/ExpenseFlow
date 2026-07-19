import { User } from "../models/user.model.js";
import validator from 'validator';
import bcrypt from "bcrypt";


//method to generate tokens(helper fn)

const generateAcccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        if (!user) {
        throw new Error("User not found");
       }
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
    } catch (error) {
        throw error;
    }
}


//CONTROLLERS:-

//Register
const register = async(req,res) => {
    //Data extract:
    const {name, email, password} = req.body;
    //validation
    if([name , email, password].some((x) => x?.trim() === "")){
        return res.status(400).json({
            success: false,
            message: "All feilds required"
        })
     };
     if(!validator.isEmail(email)){
        return res.status(400).json({
            success: false,
            message: "Invalid email"
        })
     }
     if(password.length<8){
        return res.status(400).json({
            success: false,
            message: "Password length must be of 8 characters"
        })
     }

     try {
        const existedUser = await User.findOne({email});
        if(existedUser){
            return res.status(409).json({
                success: false,
               message: "account already exist"
            })
        }
        //hasing
        const hashed = await bcrypt.hash(password, 10)
        //create user
        const user = await User.create({name, email, password: hashed})
       
         return res.status(201).json({
            success: true,
            message:"user registered successfully"
        })

     } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
     }
};

//Login
const login = async(req,res) => {
    const {email, password} = req.body;
    
    if(!email || !password){
        return res.status(400).json({
            success: false,
            message: "All feilds required"
        })
    }
    
    if(!validator.isEmail(email)){
         return res.status(400).json({
            success: false,
            message: "Invalid email"
        })
    }
    
    try {
        //check whether user exist or not
    const user = await User.findOne({email})
    if(!user){
        return res.status(404).json({
            success: false,
            message: "invalid email or password"
        })
    }

    //const match = await bcrypt.compare(passwor, user.passsword);

    const isPasswordValid = await user.isPasswordCorrect(password) //as we wrote a custom method in userSchema
    if(!isPasswordValid){
        return res.status(401).json({
            success: false,
            message: "incorrect password"
        })
    }

    //generate tokens:
   const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id); //now user is succesfully loggedIn

   //now send cookies
   const options ={
    httpOnly: true,//browser stores it but js cannot read it
    secure: process.env.NODE_ENV === "production" //cookies work on localhost not on https
   }

   const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken");

   return res.status(200)
   .cookie("accessToken",accessToken, options)
   .cookie("refreshToken",refreshToken, options).json({
     success: true,
     message: " Logged In successfully"
   })

} catch (error) {
        return res.status(500).json({
            success: false,
            message: "server error"
        })
    }

};

//Logout
const logout = async(req,res) => {
    try {
         await User.findByIdAndupdate(
        req.user._id,{

            $unset:{
                refreshToken: 1
            }
        },
        {
            new: true
        }
     )

      const options = {
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production"
  }

  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json({
    success: true,
    message:"user logged out"
  })
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "unauthorized"
        })
    }
}

//refreshAccessToken
const refreshAccessToken = async(req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        return res.status(401).json({
            success: false,
            message: "unauthorized"
        })
    }

    try {
         const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
          //user ko le aunaga
        const user = await User.findById(decodedToken?._id)
        if(!user){
            return res.status(401).json({
            success: false,
            message: "Invalid Tokens"
        })
    }

    //if matches then i will generate new refresh and access token for the user
     if(incomingRefreshToken !== user?.refreshToken){
        return res.status(401).json({
             success: false,
             message: "refresh token is expired"
        })
     }

     const {accessToken, newrefreshToken} = await generateAcccessAndRefreshTokens(user._id)
      const options = {
           httpOnly: true, 
           secure: true
        }
        
        return res
        .status (200)
        .cookie("accessToken",accessToken)
        .cookie("refreshToken",newrefreshToken)
        .json({
            success:true,
            message:"tokens are generated"
        })
    } catch (error) {
        return res.status(401).json({
              success:false,
              message:"inavalid refresh tokens"
        }) 
    }
}

//to get login userdetails:
const getCurrentUser = async(req,res) =>{
  try {
     const user = await User.findById(req.user._id).select("name email")
   if(!user){
    return res.status(404).json({
        success: false,
        message: "user not found"
    });
   }

   res.json({
    success:true,
    user
   })
  } catch (error) {
      return res.status(500).json({
              success:false,
              message:"server error"
        }) 
  }
}

//to update user profile: (use this method as my mail is unique)
const updateProfile = async(req,res) => {
    const {name , email} = req.body; //these fields can be updated
    if(!name || !email || !validator.isEmail(email)){
          return res.status(400).json({
           success: false,
           message: "valid email and required here"
    })
 }

 try {
    //it checks whether is there any user with this same email
    const existingUser = await User.findOne({email, _id: {$ne: req.user.id}})
    if(existingUser){
        return res.status(409).json({
            success: false,
            message: "email already exists"
        })
    }
    const user = await User.findByIdAndupdate(
        req.user._id,
        {name, email},
        {new: true, runValidators: true, select:"name email"}
    );
    return res.status(200).json({
        success: true,
        user
    })
 } catch (error) {
       return res.status(500).json({
              success:false,
              message:"server error"
        }) 
 }
}

//change user password
const updatePassword = async(req,res) =>{
    const {currentPassword, newPassword} = req.body
    if(!currentPassword || !newPassword || newPassword <8){
        return res.status(400).json({
            success: false,
            message: "password is too short"
        })
    }
    try {
        
    const user = await User.findById(req.user._id).select("password")
    if(!user){
        return res.status(400).json({
            success: false,
            message: "user not found"
        })
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if(!match){
        return res.status(401).json({
            success: false,
            message: "current password is incorrect"
        })
    }

    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()
    res.json({
        success: true,
        message: "password changed"
    })

    } catch (error) {
          return res.status(500).json({
              success:false,
              message:"server error"
        }) 
    }
}

export {
    register,
    login,
    logout,
    getCurrentUser,
    refreshAccessToken,
    updateProfile,
    updatePassword
};