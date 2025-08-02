require("dotenv").config();
const express = require("express");
const session = require('express-session');
const cookieParser = require('cookie-parser');
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const { Server } = require("socket.io");
const http = require("http"); 

const app = express();

// Create an HTTP server from Express
const server = http.createServer(app);

// Socket.io setup
// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:3000", // Frontend origin
//     credentials: true,
//   },
// });


// Middleware setup
app.use(cookieParser()); // Parse cookies
app.use(
  session({
    secret: 'your_secret_key_here', 
    resave: false, 
    saveUninitialized: true, // Create a session even if no data is stored
    cookie: { 
      maxAge: 1000 * 60 * 60 * 24, // Session expires in 24 hours (adjust as needed)
      httpOnly: true, // Prevent client-side JS from accessing the cookie (security)
      secure: process.env.NODE_ENV === 'production', // Enable HTTPS-only in production
    },
  })
);


// Middleware setup
app.use(
  cors({
    origin: ["http://localhost:5173", "https://labour-panel.onrender.com"],
    // origin: "http://localhost:3001", // Frontend origin
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],  // Allow custom headers
    optionsSuccessStatus: 200
  })
);

// Handle OPTIONS preflight requests
app.options('*', cors());

const adminAuthRoute = require("./routes/admin/adminAuthRoute");
const authRoute = require("./routes/authRoute");
const serviceCategoryRoute = require("./routes/serviceCategoryRoute");
const userRoute = require("./routes/userRoute");
const productCategoryRoute = require("./routes/productCategoryRoute");
const hairStylistRoute = require("./routes/hairStylistRoute");
const productRoute = require("./routes/productRoute");
const cartRoute = require("./routes/cartRoute");
const packageRoute = require("./routes/packageRoute");
const adminAppointmentRoute = require("./routes/admin/adminAppointmentRoute");

const bodyParser = require("body-parser");
const PORT = process.env.PORT || 3512;
const MONGO_URL = process.env.MONGO_URL;

app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Admin API routes
app.use("/api/admin", adminAuthRoute);
app.use("/api/auth", authRoute);
app.use("/api/service", serviceCategoryRoute);
app.use("/api/user", userRoute);
app.use("/api/product-category", productCategoryRoute);
app.use("/api/stylist", hairStylistRoute);
app.use("/api/product", productRoute);
app.use("/api/cart", cartRoute);
app.use("/api/package", packageRoute);
app.use("/api/admin", adminAppointmentRoute);

// Response handler Middleware
app.use((obj, req, res, next) => {
  const statusCode = obj.status || 500;
  const message = obj.message || "Something went wrong!";
  return res.status(statusCode).json({
    success: [200, 201, 204].includes(statusCode),
    status: statusCode,
    message: message,
    data: obj.data,
  });
});

// Connect to MongoDB and start server
mongoose.set("strictQuery", false);
mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log("Connected to MongoDB");
    server.listen(PORT, () => {
      // console.log(`Server is running at http://54.205.149.77:${PORT}`);
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });
