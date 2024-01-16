// const express = require('express')
// const { body } = require('express-validator')
// const fileUpload = require('../middleware/multer')
// const { auth } = require('../middleware/auth')

// const feedController = require('../controllers/feed')

// const router = express.Router()

// router.get('/posts', auth, feedController.getPosts)

// router.post(
//   '/post',
//   auth,
//   fileUpload.single('image'),
//   [body('title').trim().isLength({ min: 5 }), body('content').trim().isLength({ min: 5 })],
//   feedController.createPost
// )

// router.patch(
//   '/post/:id',
//   auth,
//   fileUpload.single('image'),
//   [body('title').trim().isLength({ min: 5 }), body('content').trim().isLength({ min: 5 })],
//   feedController.editPost
// )

// router.get('/post/:id', auth, feedController.getPost)

// router.delete('/post/:id', auth , feedController.deletePost)

// module.exports = router
