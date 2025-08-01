const express = require("express");
const ImageKit = require("imagekit");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const postModel = require("../models/post.model");
const isAuthenticated = require("../middlewares/auth");
require("dotenv").config();

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

router.get("/detail/:id", async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");

    let decode = null;
    const token = req.cookies?.token;
    if (token) {
      try {
        decode = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        console.warn("JWT decode failed:", err.message);
      }
    }

    res.render("postDetail.ejs", { post, decode });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

router.get("/add", isAuthenticated, (req, res) => {
  res.render("postForm", { user: req.user });
});

router.post("/add", isAuthenticated, upload.single("image"), async (req, res) => {
  const { title, author, category, content } = req.body;
  const email = req.user.email;

  try {
    const imageUpload = await imagekit.upload({
      file: req.file.buffer,
      fileName: req.file.originalname,
      folder: "/blog-posts",
    });

    const newPost = new postModel({
      title,
      author,
      category,
      content,
      image: imageUpload.url,
      email,
      date: new Date(),
    });

    await newPost.save();
    res.redirect("/");
  } catch (err) {
    console.error("Add Post error:", err.message);
    res.status(500).send("Failed to create new post");
  }
});





module.exports = router;
