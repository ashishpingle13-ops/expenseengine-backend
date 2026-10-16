import Attendance from "../models/Attendance.js";
import LedgerEntry from "../models/LedgerEntry.js";
import Worker from "../models/Worker.js";

export const getMonthlySummary = async (req,res) => {
    try {
        const { month } = req.query;
        const firebaseUid = req.user.firebaseUid;

        if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
          return res.status(400).json({ message: "Valid month is required (YYYY-MM)" });
      }

        // 2. Time Object setup for Ledger (Date objects)
        const [year, monthNum] = month.split('-');
        const startDate = new Date(`${year}-${String(monthNum).padStart(2, '0')}-01T00:00:00.000+05:30`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        const monthRegex = new RegExp(`^${month}`);

        // 3. FETCH ATTENDANCE (Using $regex for strings)
        const attendances = await Attendance.find({
            firebaseUid,
            date: { $regex: monthRegex }
        }).lean();

        // 4. Fetch the workers also
        const workers = await Worker.find({ firebaseUid }).lean();

        console.log(`[REPORTS] Found ${attendances.length} attendance sheets for ${month}`);

        let totalVeg = 0, totalNonVeg = 0 ,totalPaise = 0, totalAbsent = 0;
        const workerStats = {}; // Temporary object to group by workerId
        
        attendances.forEach(record => {
            if (record.statuses) {
                Object.entries(record.statuses).forEach(([key, status]) => {
                    // Figure out who this is and if it's a night shift
                    const isNight = key.includes('_night');
                    const workerID = key.replace('_night', ''); // Removes "_night" to get the pure ID

                    const cleanStatus = String(status).trim().toLowerCase();

                    // Open a "folder" for this worker if they don't have one yet
                    if (!workerStats[workerID]){
                        workerStats[workerID] = { veg: 0, nonveg: 0, paise: 0, absent: 0, nights: 0 };
                    }

                    // Add to the GRAND TOTALS exactly like you were doing before
                    if (cleanStatus === 'veg') totalVeg += 1;
                    if (cleanStatus === 'non-veg' || cleanStatus === 'n-veg') totalNonVeg += 1; 
                    if (cleanStatus === 'paise') totalPaise += 1;
                    if (cleanStatus === 'absent') totalAbsent += 1;

                    // ALSO add to the SPECIFIC WORKER'S totals!
                    if(cleanStatus === 'veg') workerStats[workerID].veg += 1;
                    if (cleanStatus === 'non-veg' || cleanStatus === 'n-veg') workerStats[workerID].nonveg += 1; 
                    if (cleanStatus === 'paise') workerStats[workerID].paise += 1;
                    if (cleanStatus === 'absent') workerStats[workerID].absent += 1;
                    
                    // Track night shifts (only if they actually worked that night)
                    if(isNight && cleanStatus !== 'absent' && cleanStatus !== ''){
                        workerStats[workerID].nights += 1;
                    }
                });
            }
        });


        // 5. Match calculated stats with the actual worker names
        const workerBreakdown = workers
            .filter(w => w.isActive !== false || workerStats[w._id.toString()])
            .map(w => {
                const stats = workerStats[w._id.toString()] || { veg: 0, nonveg: 0, paise: 0, absent: 0, nights: 0 };
                return {
                    id: w._id,
                    name: w.name,
                    initial: w.name ? w.name.charAt(0).toUpperCase() : 'W',
                    veg: stats.veg,
                    nonveg: stats.nonveg,
                    paise: stats.paise,
                    absent: stats.absent,
                    nights: stats.nights
                };
            });

        // 6. FETCH LEDGER DATA (Using Date objects for time)
        const ledgers = await LedgerEntry.find({
            firebaseUid,
            date: { $gte: startDate, $lt: endDate }
        }).lean();

        console.log(`[REPORTS] Found ${ledgers.length} ledger entries for ${month}`);

        let totalAdvance = 0;
        ledgers.forEach(entry => {
            if(entry.entryType === 'Advance'){
                totalAdvance += entry.amount || 0;
            }
        });

        // 7. SEND THE FINAL MATH TO THE FRONTEND
        res.status(200).json({
            totalVeg,
            totalNonVeg,
            totalPaise,
            totalAbsent,
            totalAdvance,
            workerBreakdown
        });

    } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).json({ message: "Failed to generate monthly report." });
    }
}