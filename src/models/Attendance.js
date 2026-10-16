import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
    firebaseUid: {
        type: String,
        required: true,
        index: true
    },
    
    date: {
        type: String, 
        required: true, 
    },
    statuses: {
        type: Map,
        of: String,
        required: true
    }
}, { timestamps: true });


// 🚨 COMPOUND INDEX: This ensures a contractor can't save two attendance sheets 
// for the same date, but DIFFERENT contractors can have attendance on the same date!
attendanceSchema.index({ firebaseUid: 1, date: 1}, { unique: true })
const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;