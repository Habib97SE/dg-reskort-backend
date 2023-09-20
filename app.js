require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

// Environment Variable Validation
if (!process.env.MONGO_DB_URI) {
  console.error("Please provide a valid MONGO_DB_URI in the .env file.");
  process.exit(1);
}

const mongoDBURI = process.env.MONGO_DB_URI;

// Database Connection
mongoose
  .connect(mongoDBURI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((error) =>
    console.error("Error connecting to MongoDB Atlas", error.message)
  );

const statSchema = new mongoose.Schema({
  ipAddress: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const Stat = mongoose.model("stats", statSchema);

app.use(cors());
app.use(express.json());

// Utility Functions
// ... (Keep them here for now but consider moving to a utilities module later)

app.post("/visit", async (req, res) => {
  try {
    const { ipAddress, date } = req.body;
    if (!isValidIP(ipAddress)) {
      return res.status(400).send({ message: "Invalid IP Address" });
    }

    if (await hasIPBeenLoggedToday(ipAddress)) {
      return res.status(409).send({ message: "IP already logged for today." });
    }

    const stat = new Stat({
      ipAddress,
      date: date
        ? convertToCustomFormat(date)
        : convertToCustomFormat(new Date()),
    });
    const result = await stat.save();

    if (result) {
      console.log("Added successfully.");
      res.status(201).send({ message: "Added successfully." });
    } else {
      console.error("Error saving IP Address.");
      res.status(500).send({ message: "Internal server error." });
    }
  } catch (e) {
    console.error("Error handling /visit request:", e.message);
    res.status(500).send({ message: "Internal server error." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
