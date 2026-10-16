import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firebaseUid:{
        type: String,
        required: true,
        unique: true
    },
    phoneNumber:{
        type: String
    },
    email:{
        type: String
    },
    name: {
        type: String,
    }
    
} , { timestamps: true});

const User = mongoose.model("User", userSchema);

export default User;