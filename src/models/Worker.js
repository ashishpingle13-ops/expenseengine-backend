import mongoose from "mongoose";

const workerSchema = new mongoose.Schema({
    firebaseUid:{
        type: String,
        required: true,
        index: true // Makes database searches much faster
    },
    name: {
        type:String,
        required:true
    },
    phoneNumber: {
        type:String,
        required:true
    },
    currentAdvanceBalance: {
        type:Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }

} , { timestamps: true });

const Worker = mongoose.model("Worker", workerSchema)

export default Worker;
