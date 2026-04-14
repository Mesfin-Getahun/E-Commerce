import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Name is required"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minLength: [6, "Password must be at least 6 characters long"]
    },
    cartItems: [
        {
        quantity:{
          type: Number,
          default: 1,      
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
        }
     }
    ],
    role:{
        type: String,
        enum: ["customer", "admin"],
        default: "customer"
    }
   

},
{
    timestamps: true
}
);

const User = mongoose.model("User", userSchema);

export default User;