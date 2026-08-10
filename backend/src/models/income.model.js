import mongoose, {Schema} from 'mongoose'
import { User } from './user.model.js';

const incomeSchema = new Schema({
  description : {
    type : String,
    required : true
  },
  amount : {
    type : Number,
    required : true
  },
  category: {
    type: String,
    required : true,
  },
  date: {
    type: Date,
    required : true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    default: "income",  
  },

},{timestamps:true});

export const Income = mongoose.model("Income",incomeSchema);