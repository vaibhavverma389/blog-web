const express = require("express");
const router = express.Router();
const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// GET: Show Register Page
router.get("/register", (req, res) => {
    res.render("register", { error: null });
});

// POST: Register New User
router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // 1. Validation
        if (!username || !email || !password) {
            return res.render("register", { error: "All fields are required!" });
        }

        // 2. Check if email already registered
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.render("register", { error: "Email is already registered. Please login." });
        }

        // 3. Hash password
        const hashedPass = await bcrypt.hash(password, 10);

        // 4. Save user
        await userModel.create({
            username,
            email,
            password: hashedPass,
        });

        res.redirect("/users/login");
    } catch (error) {
        console.error("Registration Error:", error);
        res.render("register", { error: "Something went wrong. Please try again." });
    }
});

// GET: Show Login Page
router.get("/login", (req, res) => {
    res.render("login", { error: null });
});

// POST: Login User
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.render("login", { error: "User not found. Please register." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render("login", { error: "Incorrect password. Try again." });
        }

        // Create JWT Token
        const token = jwt.sign(
            { id: user._id, username: user.username },
            "hfdskjasfgksjdfgfdalsdf", // secret key - use env in production
            { expiresIn: "1d" }
        );

        // Set token in cookie
        res.cookie("token", token, { httpOnly: true });
        res.redirect("/");
    } catch (error) {
        console.error("Login Error:", error);
        res.render("login", { error: "Login failed. Please try again." });
    }
});

// GET: Logout User
router.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/users/login");
});

module.exports = router;
