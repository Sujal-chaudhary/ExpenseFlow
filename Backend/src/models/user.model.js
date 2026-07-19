import mongoose ,{ Schema } from 'mongoose';

const userSchema = new Schema({
    name:{
      type: String,
      required: true,
      trim: true
    },
    email:{
        type: String,
        required: true,
        unique: true //makes it searchable
    },
    password:{
        type: String,
        required: true,
    },
     refreshToken:{
        type: String
     },
     
},{timestamps:true});


export const User = mongoose.model("User",userSchema)

//custom methods:-
userSchema.methods.isPasswordCorrect = async function(password) {
      return await bcrypt.compare(password, this.password)
   } 

//jwt Tokens:-
userSchema.methods.generateAccessToken = function(){
      return jwt.sign(
         {
            _id: this._id, // left is payload name and right is coming form our DB
            email: this.email,
            name: this.name
         },
         process.env.ACCESS_TOKEN_SECRET,
         {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
         }
   )
};

/* Refresh token:
       Lives longer, Used to generate new access tokens, Contains minimal data */
   userSchema.methods.generateRefreshToken = function(){
       return jwt.sign(
         {
            _id: this._id, // left is payload name and right is coming form our DB
         },
         process.env.REFRESH_TOKEN_SECRET,
         {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
         }
   )
 }