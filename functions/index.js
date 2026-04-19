const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Backend running on Firebase");
});

// Example API route
app.get("/api/test", (req, res) => {
  res.json({ message: "API working" });
});

// Export as Firebase Function
exports.api = functions.https.onRequest(app);
