import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';

// 1. Load the secure JSON key (using your exact filename)
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : JSON.parse(fs.readFileSync(new URL('../firebaseServiceAccount.json', import.meta.url)));

// 2. Initialize Firebase Admin safely (The Modern Way)
if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount)
    });
}

// 3. The Security Guard Function
export const protect = async (req, res, next) => {
    let token;

    // Check if the frontend sent a Bearer token in the headers
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        try {
            // Split the string "Bearer <token>" to grab just the token
            token = req.headers.authorization.split(" ")[1];

            // Verify the token using the new Modular Auth API
            const decodedToken = await getAuth().verifyIdToken(token);

            // Attach the user's details to the request so the controllers can use it
            req.user = {
                firebaseUid: decodedToken.uid,
                email: decodedToken.email || "",
                phone: decodedToken.phone_number || ""
            };

           return next(); // Token is valid, let them through!
        } catch (error) {
            console.error("Not authorized, token failed:", error);
           return res.status(401).json({ message: "Not authorized, token failed" });
        }
    }

    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token" });
    }
};