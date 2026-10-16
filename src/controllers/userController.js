import User from "../models/User.js";

export const syncUser = async (req, res) => {
    try {
        // req.user comes directly from the protect middleware we just wrote
        const { firebaseUid, email, phone } = req.user;

        // 1. Check if this contractor already exists in our MongoDB
        let user = await User.findOne({ firebaseUid });

        // 2. If they don't exist, this is their first time logging in. Create them!
        if(!user){
            user = await User.create({
                firebaseUid,
                email: email || "",
                phoneNumber: phone || ""
            });
            console.log("New Contractoe Account Created in MongoDB!");
        }else{
            console.log("Contractor Account Synced!");
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("Error syncing user:", error);
        res.status(500).json({ message: "Server error syncing user" });
    }
};


// GET user profile data
export const getUserProfile = async (req, res) => {
    try {
        const { firebaseUid, email, phone } = req.user;
        const user = await User.findOneAndUpdate(
            { firebaseUid },
            { $setOnInsert: { firebaseUid, email: email || "", phoneNumber: phone || "" } },
            { new: true, upsert: true }
        );
        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// UPDATE user profile data (Name & Phone Number)
export const updateUserProfile = async (req, res) => {
    try {
        const { name, phoneNumber } = req.body;
        const updatedUser = await User.findOneAndUpdate(
            { firebaseUid: req.user.firebaseUid },
            { name, phoneNumber },
            { new: true, upsert: true }
        );
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Server Error" });
    }
};