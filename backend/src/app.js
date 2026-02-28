const express = require("express");
const cors = require("cors");
const path = require("path");

// Security Packages
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");

// Route files
const auth = require("./routes/auth");
const issues = require("./routes/issue");

const app = express();

// Set security headers
app.use(helmet({ crossOriginResourcePolicy: false })); // allows images to be loaded cross-origin

// Prevent XSS attacks
app.use(xss());

// Rate limiting (100 requests per 10 mins from same IP)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Prevent http param pollution
app.use(hpp());

// Sanitize data (Prevents NoSQL injection like {"email": {"$gt": ""}})
app.use(mongoSanitize());

// Enable CORS
app.use(cors());

// Body parser
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
