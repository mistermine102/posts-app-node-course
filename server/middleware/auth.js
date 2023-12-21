const jwt = require('jsonwebtoken')
const Post = require('../models/post')

exports.auth = (req, res, next) => {
  try {
    const authHeader = req.get('Authorization')
    if (!authHeader) {
      req.isAuth = false
      return next()
    }
    const token = authHeader.split('Bearer ')[1]

    if (!token) {
      req.isAuth = false
      return next()
    }

    const authResult = jwt.verify(token, 'secret')
    req.userId = authResult._id
    req.isAuth = true
    next()
  } catch (error) {
    req.isAuth = false
    next()
  }
}

// exports.isPostAuthor = async (req, res, next) => {
//   try {
//     const { id: postId } = req.params

//     const post = await Post.findById(postId)

//     if (!post.creator.equals(req.userId)) {
//       const error = new Error('Not a post author.')
//       error.statusCode = 401
//       throw error
//     }
//     next()
//   } catch (error) {
//     next(error)
//   }
// }
