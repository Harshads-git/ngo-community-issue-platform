const express = require("express");
const cors = require("cors");
const auth = require("./routes/auth");
const issues = require("./routes/issue");

const app = express();

const path = require("path");

app.use(cors());
app.use(express.json());

// Set static folder so frontend can load images from /uploads
app.use(express.static(path.join(__dirname, "../public")));

// Mount routers
app.use("/api/auth", auth);
app.use("/api/issues", issues);

app.get("/", (req, res) => {
  res.json({ message: "Backend is running successfully" });
});

module.exports = app;
