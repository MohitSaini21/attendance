import express from "express"; // Core framework for building the server
import ejs from "ejs";
import cookieParser from "cookie-parser";
import User from "./models/userSchema.js";
import { checkAuthHome } from "./middlewares/checkAuthHome.js";
import { generateTokenAndSetCookie } from "./utils/createJwtTokenSetCookie.js";
import { ConnectDB } from "./config/db.js";
import { employeeRouter } from "./routes/employee.js";
import { adminRouter } from "./routes/admin.js";
import { checkAuth } from "./middlewares/checkAuthDash.js";

// Set EJS as the view engine (Corrected 'view engine' typo)

const app = express();
app.set("view engine", "ejs");
app.use(cookieParser());

// Middlewares for Parsing and Static Files (Optional, Add if Needed)
app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded requests
app.use(express.static("public")); // Serve static files from the "public" directory
// auth spedcific routes
app.get("/", checkAuthHome, (req, res) => {
  return res.render("auth/home.ejs");
});
app.get("/adminSignup", checkAuthHome, (req, res) => {
  return res.render("auth/adminSignup.ejs");
});
app.post("/adminSignup", checkAuthHome, async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  const admin = await User.findOne({ role: "admin", email, password });
  if (admin) {
    generateTokenAndSetCookie(res, admin._id, admin.role);
    return res.json({ success: true });
  }
});
app.get("/employeeSignup", checkAuthHome, (req, res) => {
  return res.render("auth/employeeSignup.ejs");
});
app.post("/employeeSignup", checkAuthHome, async (req, res) => {
  let { employeeId, password } = req.body;
  console.log(employeeId, password);

  // Convert employeeId to a number
  employeeId = Number(employeeId);

  // Find employee in the database
  const employee = await User.findOne({ employeeID: employeeId });

  console.log(employee);
  if (employee) {
    if (employee.password === password) {
      generateTokenAndSetCookie(res, employee._id, employee.role);
      return res.json({ success: true });
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }
  } else {
    return res
      .status(404)
      .json({ success: false, message: "Employee not found" });
  }
});

// coommone route for logout

app.listen(3000, () => {
  ConnectDB();
  console.log(`Server is listening at 3000 port `);
});

// router specific
app.use(
  "/employee",
  checkAuth,
  (req, res, next) => {
    if (req.user.role == "employee") {
      return next();
    } else {
    }
  },
  employeeRouter
);
app.use(
  "/admin",
  checkAuth,
  (req, res, next) => {
    if (req.user.role == "admin") {
      return next();
    } else {
    }
  },
  adminRouter
);

app.get(
  "/logout",
  checkAuth,
  (req, res, next) => {
    if (req.user.role == "admin" || req.user.role == "employee") {
      return next();
    } else {
    }
  },
  (req, res) => {
    try {
      // Clear cookies
      res.clearCookie("pageLoaded");
      res.clearCookie("notifPermissionPageLoaded");
      res.clearCookie("authToken");

      // Redirect to the homepage
      return res.redirect("/");
    } catch (error) {
      console.error("Error during logout:", error);
      return res.status(500).send("An error occurred while logging out.");
    }
  }
);
