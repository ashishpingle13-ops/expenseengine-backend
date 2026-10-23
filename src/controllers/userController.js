import User from "../models/User.js";

export const syncUser = async (req, res) => {
    try {
        const { firebaseUid, name, email, phone } = req.user;

        let user = await User.findOne({ firebaseUid });

        if (!user) {
            user = await User.create({
                firebaseUid,
                name: name || "",
                email: email || "",
                phoneNumber: phone || ""
            });
            console.log("New Manager Account Created in MongoDB!");
        } else if (!user.name && name) {
            user.name = name;
            await user.save();
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("Error syncing user:", error);
        res.status(500).json({ message: "Server error syncing user" });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const { firebaseUid, name, email, phone } = req.user;

        let user = await User.findOne({ firebaseUid });

        if (!user) {
            user = await User.create({
                firebaseUid,
                name: name || "",
                email: email || "",
                phoneNumber: phone || ""
            });
        } else {
            let needsSave = false;
            if (!user.email && email) { user.email = email; needsSave = true; }
            if (!user.phoneNumber && phone) { user.phoneNumber = phone; needsSave = true; }
            if (!user.name && name) { user.name = name; needsSave = true; }
            if (needsSave) await user.save();
        }

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