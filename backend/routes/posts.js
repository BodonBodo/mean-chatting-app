const express = require('express');
const multer = require('multer');

const Post = require('../models/post');

const router = express.Router();

const MIME_TYPE_MAP = {
  'image/png': 'png',
  'image/jpg': 'jpg',
  'image/jpeg': 'jpeg'
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isValid = MIME_TYPE_MAP[file.mimetype];
    let error = new Error('invalid mimetype');
    if(isValid){
      error = null;
    }
    // destination path relative to server.js
    cb(error, 'backend/images')
  },
  filename: (req, file, cb) => {
    const name = file.originalname.toLowerCase().split(' ').join('-');
    const ext = MIME_TYPE_MAP[file.mimetype];
    cb(null, name + '-' + Date.now() + '.' + ext);
  }
});

// /api/posts is already present in path due to app.js

// can add any number of middleware to paths,
// evaluated from left to right
// 'image' tells multer to look for image attribute of req.body
router.post('', multer({storage: storage}).single('image'), async (req, res, next) => {
  const url = req.protocol + '://' + req.get("host");
  const post = new Post({
    title: req.body.title,
    content: req.body.content,
    imagePath: url + '/images/' + req.file.filename
  });
  // console.log(post);
  const createdPost = await post.save();
  res.status(201).json({
    message: "post added successfully",
    post: {
      ...createdPost.toObject(),
      id: createdPost._id
    }
  });
});

router.get('', async (req, res, next) => {
  const postQuery = Post.find();
  // + is for converting string to int
  const pageSize = +req.query.pageSize;
  const currentPage = +req.query.page;
  if (pageSize && currentPage) {
    postQuery
      .skip(pageSize * (currentPage - 1)) // 1 based indexing for page
      .limit(pageSize);
  }
  const documents = await postQuery;
   res.status(200).json({
      message: 'posts sent successfully',
      posts: documents
    });
});

// get single post for Update
router.get('/:id', async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (post){
    res.status(200).json({
      message: 'post sent successfully',
      post: post
    });
  } else {
    res.status(404).json({
      message: 'post not found!'
    });
  }
});

router.delete('/:id', async (req, res, next) => {
  const result = await  Post.deleteOne({_id: req.params.id});
  res.status(200).json({
    message: 'Post deleted!'
  });
});

router.put('/:id',
  multer({storage: storage}).single('image'),
  async (req, res, next) => {
    let imagePath = req.body.imagePath;
    if (req.file) {
      const url = req.protocol + '://' + req.get("host");
      imagePath = url + '/images/' + req.file.filename;
    }
    const post = {
      title: req.body.title,
      content: req.body.content,
      imagePath: imagePath
    };
    const result = await Post.updateOne({_id: req.params.id}, post);
    res.status(200).json({ message: 'Update successful!' , imagePath: imagePath});
})

module.exports = router;
