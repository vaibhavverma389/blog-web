const express = require("express");
const ImageKit = require("imagekit");
const multer = require("multer");
const postModel = require("../models/post.model");
const isAuthenticated = require("../middlewares/auth");
require("dotenv").config();

const router = express.Router();

// ---------- Multer Setup (in-memory storage) ----------
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ---------- ImageKit Configuration ----------
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// ---------- Route: Show Single Blog Post ----------
router.get("/detail/:id", async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");
    res.render("postDetail.ejs", { post });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// ---------- Route: Show Update Form ----------
router.get("/update/:id", isAuthenticated, async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");
    res.render("postUpdate.ejs", { post });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// ---------- Route: Handle Post Update ----------
router.post("/update/:id", isAuthenticated, upload.single("image"), async (req, res) => {
  const { title, author, category, content } = req.body;
  const updateData = { title, author, category, content };

  try {
    if (req.file) {
      const imageUpload = await imagekit.upload({
        file: req.file.buffer,
        fileName: req.file.originalname,
        folder: "/blog-posts",
      });
      updateData.image = imageUpload.url;
    }

    const updated = await postModel.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) return res.status(404).send("Post not found");

    res.redirect(`/posts/detail/${req.params.id}`);
  } catch (err) {
    console.error("Update error:", err.message);
    res.status(500).send("Failed to update post");
  }
});

// ---------- Route: Delete Blog Post ----------
router.get("/delete/:id", isAuthenticated, async (req, res) => {
  try {
    const deleted = await postModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).send("Post not found");
    res.redirect("/");
  } catch (err) {
    console.error("Delete error:", err.message);
    res.status(500).send("Failed to delete post");
  }
});

// ---------- Route: Show Add Post Form ----------
router.get("/add", isAuthenticated, (req, res) => {
  res.render("postForm", { user: req.user });
});

// ---------- Route: Handle Add New Post ----------
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
