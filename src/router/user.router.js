const express = require("express");
const router = express.Router();
const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret"; // Always use env in production

// ------------------ Register ------------------
// GET: Show Register Page
router.get("/register", (req, res) => {
    res.render("register", { error: null });
});

// POST: Register New User
router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // 1. Validate form input
        if (!username || !email || !password) {
            return res.render("register", { error: "All fields are required." });
        }

        // 2. Check if email already exists
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.render("register", { error: "Email is already registered." });
        }

        // 3. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Save new user
        await userModel.create({ username, email, password: hashedPassword });

        // 5. Redirect to login page
        res.redirect("/users/login");
    } catch (err) {
        console.error("Registration Error:", err.message);
        res.render("register", { error: "Something went wrong. Try again." });
    }
});
// const express = require("express");
// const router = express.Router();

// Render login form
router.get("/login", (req, res) => {
  res.render("login"); // This should match `views/login.ejs`
});

// module.exports = router;


// ------------------ Login ------------------
// GET: Show Login Page
router.get("/login", (req, res) => {
    res.render("login", { error: null });
});

// POST: Login User
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Find user
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.render("login", { error: "User not found. Please register." });
        }

        // 2. Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render("login", { error: "Incorrect password." });
        }

        // 3. Generate token
        const token = jwt.sign(
            { id: user._id, username: user.username },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        // 4. Set cookie
        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });

        res.redirect("/");
    } catch (err) {
        console.error("Login Error:", err.message);
        res.render("login", { error: "Login failed. Please try again." });
    }
});

// ------------------ Logout ------------------
// GET: Logout User
router.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/users/login");
});

module.exports = router;
