import mongoose from "mongoose";

const ledgerEntrySchema = new mongoose.Schema({
    firebaseUid: {
        type: String,
        required: true,
        index: true
    },
    date: {
        type: Date,
        default:Date.now
    },
    entryType: {
        type:String,
        required: true,
        enum: ["Advance","Expense","BossDeposit"] // 💡 Restricted values
    },
    workerId: {
        type:mongoose.Schema.Types.ObjectId,
        ref: "Worker"
    },
    amount: {
        type:Number,
        default:0,
        min: [0, "Amount cannot be negative"] // Blocks negative numbers at the database level!
    },
    paymentMethod: {
        type: String,
        enum: ["Cash","Online","Check","Other"],
        default: "Cash"
    },
    category: {
        type: String,
        enum: ["Materials", "Transport", "Food", "Utilities", "Other"],
        default: "Other"
    },
    description: {
        type:String,
    },
    isEdited: { 
        type: Boolean, 
        default: false 
    },
    editReason: { 
        type: String 
    },
    screenshotUrl: {
        type:String
    }

});

ledgerEntrySchema.index({ firebaseUid: 1, date: -1 });

const LedgerEntry = mongoose.model("LedgerEntry", ledgerEntrySchema);
export default LedgerEntry;