import Worker from "../models/Worker.js";
import LedgerEntry from "../models/LedgerEntry.js";


// STEP 1 == Create a new Ledger Entry (Advance, Expense, or BossDeposit)
export async function createLedgerEntry(req,res) {
    try {
        const { date, entryType, workerId, amount, paymentMethod ,description, category, screenshotUrl } = req.body;

        // 1. Validation: Make sure they provided the required entryType
        if(!entryType){
            return res.status(400).json({ message: "Entry type is required"});
        }

        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            return res.status(400).json({ message: "Valid positive amount is required" });
        }

        // 2. If this is an Advance, verify the worker exists first
      let worker = null;
      if (entryType === "Advance") {
          if (!workerId) {
              return res.status(400).json({ message: "Worker ID is required for an advance" });
          }

          worker = await Worker.findOne({
              _id: workerId,
              firebaseUid: req.user.firebaseUid
          });
          if (!worker) {
              return res.status(404).json({ message: "Worker not found" });
          }
          if (worker.isActive === false) {
            return res.status(400).json({ message: "Cannot log advance for an inactive worker" });
            }
      }

      // 3. Create and save the actual Ledger Entry FIRST (so validation runs before balance changes)
      const newEntry = new LedgerEntry({
          firebaseUid: req.user.firebaseUid,
          date,
          entryType,
          workerId: workerId || null,
          amount: Number(amount),
          paymentMethod: paymentMethod || "Cash",
          description,
          category: category || "Other",
          screenshotUrl
      });

      const savedEntry = await newEntry.save();

      // 4. Now safely increment the worker's balance
      if (worker) {
          worker.currentAdvanceBalance = (worker.currentAdvanceBalance || 0) + Number(amount);
          await worker.save({ validateBeforeSave: false });
      }

      return res.status(201).json(savedEntry);

    } catch (error) {
        console.log("Error creating ledger entry:", error);
    res.status(500).json({ message: "Server Error" });
    }
}


// STEP 2 == Get all Ledger Entries
export async function getAllLedgerEntries(req,res) {
    try {
        // .populate() fetches the actual worker data instead of just showing the ID string!
       const entries = await LedgerEntry.find({ firebaseUid: req.user.firebaseUid }).populate("workerId", "name phoneNumber").sort({ date: -1 });
        res.status(200).json(entries);
    } catch (error) {
        console.log("Error fetching ledger entries:", error);
    res.status(500).json({ message: "Server Error" });
    }
}


// STEP 3 == Get a single Ledger Entry by ID
export async function getLedgerEntryById(req,res) {
    try {
        const { id } = req.params;
        const entry = await LedgerEntry.findOne({
            _id: id,
            firebaseUid: req.user.firebaseUid
        }).populate("workerId", "name");

        if(!entry){
            return res.status(404).json({ message: "Ledger entry not found"});
        }
        res.status(200).json(entry);
    } catch (error) {
        console.log("Error fetching single ledger entry:", error);
    res.status(500).json({ message: "Server Error" });
    }
}

// STEP 4 == Update a Ledger Entry
export async function updateLedgerEntry(req,res) {
    try {
        const { id } = req.params;
        const { amount, date, paymentMethod, description, category, isEdited, editReason } = req.body;

        if (amount !== undefined && (isNaN(Number(amount)) || Number(amount) <= 0)) {
            return res.status(400).json({ message: "Valid positive amount is required" });
        }

        const oldEntry = await LedgerEntry.findOne({ 
            _id: id,
            firebaseUid: req.user.firebaseUid
        });

        if (!oldEntry) {
            return res.status(404).json({ message: "Ledger entry not found"});
        }

        if (oldEntry.entryType === "Advance") {
            const worker = await Worker.findOne({ _id: oldEntry.workerId, firebaseUid: req.user.firebaseUid });
            if (worker && worker.isActive === false) {
                return res.status(400).json({ message: "Cannot edit advance for an inactive worker" });
            }
            if (amount !== undefined && Number(amount) !== oldEntry.amount) {
                const difference = Number(amount) - oldEntry.amount; 
                await Worker.updateOne(
                    { _id: oldEntry.workerId, firebaseUid: req.user.firebaseUid },
                    { $inc: { currentAdvanceBalance: difference } }
                );
            }
        }
         
        const allowedUpdates = {};
        if (amount !== undefined) allowedUpdates.amount = Number(amount);
        if (date !== undefined) allowedUpdates.date = date;
        if (paymentMethod !== undefined) allowedUpdates.paymentMethod = paymentMethod;
        if (description !== undefined) allowedUpdates.description = description;
        if (category !== undefined) allowedUpdates.category = category;
        if (isEdited !== undefined) allowedUpdates.isEdited = Boolean(isEdited);
        if (editReason !== undefined) allowedUpdates.editReason = editReason;

        const updatedEntry = await LedgerEntry.findOneAndUpdate(
            { _id: id, firebaseUid: req.user.firebaseUid }, 
            allowedUpdates, 
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedEntry);
    }
    catch (error) {
       console.log("Error updating ledger entry:", error);
       if (error.name === "ValidationError" || error.name === "CastError") {
           return res.status(400).json({ message: error.message });
       }
       res.status(500).json({ message: "Server Error" }); 
    }
}


// STEP 5 == Delete a Ledger Entry
export async function deleteLedgerEntry(req,res) {
    try {
        const { id } = req.params;
        const deletedEntry = await LedgerEntry.findOneAndDelete({
            _id: id,
            firebaseUid: req.user.firebaseUid
        });

        if(!deletedEntry){
            return res.status(404).json({ message: "Ledger entry not found "});
        }

        if (deletedEntry.entryType === "Advance" && deletedEntry.workerId) {
            await Worker.updateOne(
                { _id: deletedEntry.workerId, firebaseUid: req.user.firebaseUid },
                { $inc: { currentAdvanceBalance: -Number(deletedEntry.amount) } }
            );
        }

        res.status(200).json({ message: "Ledger Entry Deleted Successfully!" });
    } catch (error) {
        console.log("Error deleting ledger entry:", error);
    res.status(500).json({ message: "Server Error" });
    }

}


// STEP 6 == Get Monthly Ledger Summary (Boss Deposits & Worker Advances)
export async function getMonthlyLedgerSummary(req, res) {
    try {
        const { month , year } = req.query;
        const firebaseUid = req.user.firebaseUid;

        // 1. Create a Date Range for the whole month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23,59,59);

        // 2. GET THE FULL LIST of Boss Deposits for this month (Newest first)
        const bossDepositsList = await LedgerEntry.find({
            firebaseUid,
            entryType: "BossDeposit",
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: -1 });

        // Calculate the total money received from that list
        const totalBossDeposit = bossDepositsList.reduce((sum, entry) => sum + entry.amount, 0);

        // 3. Get Worker Advances, grouped by each worker
        const workerAdvances = await LedgerEntry.aggregate([
            { $match: { firebaseUid, entryType: "Advance", date: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: "$workerId", totalAdvance: { $sum: "$amount" }, lastTransactionDate: { $max: "$date"} // Grabs the most recent transaction date!
            }},

            // This grabs the Worker's name from the Worker collection
            { $lookup: { from: "workers", localField: "_id", foreignField: "_id", as: "workerInfo" } },
            { $unwind: "$workerInfo" },

            { $project: { _id: 1, totalAdvance: 1, name: "$workerInfo.name", lastTransactionDate: 1}}
        ]);

        // 4. Calculate the total of all advances combined
        const totalAdvancesGiven = workerAdvances.reduce((sum, worker) => sum + worker.totalAdvance, 0);


        // Send it all to the frontend
        res.status(200).json({
            totalBossDeposit,
            totalAdvancesGiven,
            workerAdvances,
            bossDepositsList
        });
    } catch (error) {
        console.error("Error fetching ledger summary:", error);
        res.status(500).json({ message: "Server error fetching ledger data" });
    }
}

// STEP 7 == Get specific Worker's Ledger History
export async function getWorkerLedgerHistory(req,res) {
    try {
        const workerId = req.params.id;
        const firebaseUid = req.user.firebaseUid;

        const history = await LedgerEntry.find({
            firebaseUid: firebaseUid,
            workerId: workerId,
            entryType: "Advance"
        }).sort({ date: -1 });
        res.status(200).json(history);
    } catch (error) {
        console.error("Error fetching worker history:", error);
        res.status(500).json({ message: "Server error fetching worker history" });
    }
}

