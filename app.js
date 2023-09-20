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
    type: Date,
    required: false,
    default: Date.now,
  },
});

function isValidIP(ip) {
  const regex =
    /^(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$/;
  return regex.test(ip);
}

const Stat = mongoose.model("stats", statSchema);

app.use(cors());
app.use(express.json());

app.post("/visit", async (req, res) => {
  try {
    if (isValidIP(req.body.ipAddress)) {
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
