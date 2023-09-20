require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

const mongoDBURI = process.env.MONGO_DB_URI;

mongoose
  .connect(mongoDBURI)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB Atlas", error.message);
  });

const statSchema = new mongoose.Schema({
  ipAddress: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: false,
    default: Date.now,
  },
});

function isValidIP(ip) {
  const regex =
    /^(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$/;
  return regex.test(ip);
}

function convertToCustomFormat(dateString) {
  const date = new Date(dateString);

  const YYYY = date.getUTCFullYear();
  const MM = String(date.getUTCMonth() + 1).padStart(2, "0"); // Months are 0-based in JavaScript
  const DD = String(date.getUTCDate()).padStart(2, "0");

  const HH = String(date.getUTCHours()).padStart(2, "0");
  const MIN = String(date.getUTCMinutes()).padStart(2, "0");
  const SS = String(date.getUTCSeconds()).padStart(2, "0");

  return `${YYYY}-${MM}-${DD} ${HH}:${MIN}:${SS}`;
}

async function hasIPBeenLoggedToday(ip) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const existingEntry = await Stat.findOne({
    ipAddress: ip,
    date: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });

  return !!existingEntry;
}

const Stat = mongoose.model("stats", statSchema);

app.use(cors());
app.use(express.json());

app.post("/visit", async (req, res) => {
  try {
    if (isValidIP(req.body.ipAddress)) {
      if (await hasIPBeenLoggedToday(req.body.ipAddress)) {
        return res
          .status(409)
          .send({ message: "IP already logged for today." });
      }
      if (req.body.date) {
        req.body.date = convertToCustomFormat(req.body.date);
      } else {
        req.body.date = convertToCustomFormat(new Date());
      }
      const stat = new Stat(req.body);
      let result = await stat.save();
      if (result) {
        console.log("Added successfully.");
        res.status(201).send({ message: "Added successfully." });
      } else {
        console.log("Something went wrong");
        res.status(500).send({ message: "Internal server error." });
      }
    }
  } catch (e) {
    console.log(e);
  }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
