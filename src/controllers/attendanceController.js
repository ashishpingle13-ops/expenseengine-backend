import Attendance from "../models/Attendance.js";


// STEP 1: Fetch attendance for a specific date
export async function getAttendanceByDate(req, res) {
    try {
    const  { id: date }  = req.params;
    const record = await Attendance.findOne({ 
        date,
        firebaseUid: req.user.firebaseUid
     });
    // If no record exists for this date yet, just return an empty statuses object
    if(!record){
        return res.status(200).json({ date, statuses: {} });
    }
    res.status(200).json(record);
    } catch (error) {
        console.error("Error fetching attendance:", error);
        res.status(500).json({ message: "Server Error"});
    }
}

// STEP 2: Save or Update (Upsert) attendance for a specific date
export async function saveAttendance(req,res) {
    try {
        const { date, statuses } = req.body;

        if(!date || !statuses){
            return res.status(400).json({ message: "Date and statuses are required."});
        }
        // 💡 THE MAGIC: findOneAndUpdate with { upsert: true }
        // It looks for the date. If found, it updates it. If NOT found, it creates a new one!
        const updatedRecord = await Attendance.findOneAndUpdate(
            { firebaseUid: req.user.firebaseUid , date },
            { statuses: statuses },
            { new: true, upsert: true }
        );
        res.status(200).json({
            message: "Attandance saved successfully!",
            data: updatedRecord
        });
    } catch (error) {
        console.error("Error saving attendance:", error);
        res.status(500).json({ message: "Server Error" });
    }
}