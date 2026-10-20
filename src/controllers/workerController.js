import Worker from "../models/Worker.js";


// STEP.1 == Create a create a new worker function
export async function createWorker(req,res){
    try {
        // 1. Grab the data sent from the mobile app (the body)
        const { name , phoneNumber, upiId } = req.body;

        // 2. Validation: Make sure they didn't leave the name blank
       if(!name || !phoneNumber){
          return res.status(400).json({ message: "Worker name and phone number are required" });
      }

        // 3. Create a new worker in the database
        const newWorker = new Worker({
            name,
            phoneNumber,
            upiId: upiId || "",
            firebaseUid: req.user.firebaseUid
            // Note: currentAdvanceBalance defaults to 0 automatically!
        });
        
        // 4. Save the new Worker using a new varaible called saveWorker
        const savedWorker = await newWorker.save();

        // 5. Send a success response back to the app (if the worker is created Succesfully)
        res.status(201).json(savedWorker);

    } catch (error) {
        console.log("Error creating worker:", error);
    res.status(500).json({ message: "Server Error" });
    }
};


// STEP.2 == Get all Workers (Now supports optional ?includeInactive=true)
export async function getAllWorkers(req, res) {
    try {
        const query = { firebaseUid: req.user.firebaseUid };

        // If the frontend DID NOT explicitly ask for inactive workers, hide them by default.
        if (req.query.includeInactive !== 'true') {
            query.isActive = { $ne: false };
        }

        // Fetch the workers based on the query
        const workers = await Worker.find(query);

        res.status(200).json(workers);
    } catch (error) {
        console.log("Error fetching workers:", error);
        res.status(500).json({ message: "Server Error" });
    }
}

// STEP 3 == Get a single worker by ID
export async function getWorkerById(req,res) {
    try {
       // 1. Grab the ID from the URL
       const { id } = req.params;

       // 2. Ask Mongoose to find the worker with that specific ID
       const  getworker = await Worker.findOne({
        _id: id,
        firebaseUid: req.user.firebaseUid
       });

       // 3. Validation: What if the ID is wrong or the worker was deleted?
       if(!getworker){
        return res.status(404).json({ message: "Worker not found" });
       }

       // 4. Send the found worker back
       res.status(200).json(getworker);

    } catch (error) {
       console.log("Error fetching single worker:", error);
    res.status(500).json({ message: "Server Error" }); 
    }
}

// STEP 4 == Update a worker (e.g., Dad needs to change their phone number)
export async function updateWorker(req,res) {
    try {
    const { id } = req.params;
    const { name, phoneNumber, upiId, isActive } = req.body;
    // 1. findByIdAndUpdate takes 3 things: The ID, the new data (req.body), and options.
  const updateworker = await Worker.findOneAndUpdate(
      { _id: id, firebaseUid: req.user.firebaseUid },
      { name, phoneNumber,upiId, isActive },
      { new: true, runValidators: true }
  );

    // 2. Validation: What if the ID is wrong or the worker was deleted?
    if(!updateworker){
        return res.status(404).json({ message: "Worker not found" });
    }

    res.status(200).json(updateworker);

    } catch (error) {
      console.log("Error updating worker:", error);
    res.status(500).json({ message: "Server Error" });  
    }
}


// STEP 5 == Soft Delete a worker (Hide them, don't erase them)
export async function deleteWorker(req,res) {
    try {
    const { id } = req.params;
     
    // 1. Ask Mongoose to find and destroy the record
    const deleteworker = await Worker.findOneAndUpdate(
        { _id: id, firebaseUid: req.user.firebaseUid },
        { isActive: false }, // Flip the switch to hide them
        { new: true }
    );

    // 2. Validation: What if the ID is wrong
    if(!deleteworker){
        return res.status(404).json({ message: "Worker not found" });
    }

    // 3. Since the worker is gone, we just send a success message back
    res.status(200).json({ message: "Worker Deleted Successfully!"});

    } catch (error) {
       console.log("Error deleting worker:", error);
    res.status(500).json({ message: "Server Error" }); 
    }
}


