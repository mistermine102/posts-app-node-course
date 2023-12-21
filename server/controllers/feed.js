const { validationResult } = require('express-validator')
const Post = require('../models/post')
const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const User = require('../models/user')
const io = require('../socket')

exports.getPosts = async (req, res, next) => {
  try {
    const itemsPerPage = 2
    const { page = 1 } = req.query

    const totalItems = await Post.find().countDocuments()

    const posts = await Post.find()
      .populate('creator')
      .skip(itemsPerPage * (page - 1))
      .limit(itemsPerPage)

    res.json({ posts, totalItems })
  } catch (error) {
    next(error)
  }
}

exports.getPost = async (req, res, next) => {
  try {
    const { id } = req.params
    const post = await Post.findById(id).populate('creator')
    if (!post) {
      const error = new Error("Can't find a post")
      error.statusCode = 404
      next(error)
    }

    res.json({ post })
  } catch (error) {
    next(error)
  }
}

exports.createPost = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const error = new Error('Validation failed')
      error.statusCode = 422
      throw error
    }
    if (!req.file) {
      const error = new Error('No image provided')
      error.statusCode = 422
      throw error
    }
    const { title, content } = req.body

    const post = new Post({
      title,
      content,
      creator: new mongoose.Types.ObjectId(req.userId),
      imageUrl: 'images/' + req.file.filename,
      createdAt: new Date(),
    })

    //push the post to the user's post array
    const user = await User.findById(req.userId)
    if (!user) {
      const error = new Error('No user found')
      error.statusCode = 404
      throw error
    }
    console.log(user)
    user.posts.push(post._id)

    await user.save()
    await post.save()

    post.creator = user

    //emit socket.io event
    io.getIO().emit('posts', { action: 'create', post })

    res.json({
      message: 'Post created succesfully',
      post,
    })
  } catch (error) {
    next(error)
  }
}

exports.editPost = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const error = new Error('Validation failed')
      error.statusCode = 422
      throw error
    }

    const { id } = req.params
    const { title, content } = req.body
    let imageUrl = req.body.image

    console.log(imageUrl)

    const post = await Post.findById(id)

    if (req.file) {
      fs.unlink(path.join(__dirname, '..', '/', post.imageUrl), err => {
        if (err) return console.log(err)
      })
      imageUrl = 'images/' + req.file.filename
    }

    if (!imageUrl) {
      const error = new Error('No file picked')
      error.statusCode = 422
      throw error
    }

    if (!post) {
      const error = new Error('No post found')
      error.statusCode = 422
      throw error
    }
    post.title = title
    post.content = content
    post.imageUrl = imageUrl

    await post.save()

    io.getIO().emit('posts', {
      action: 'edit',
      post,
    })

    res.json({ post, message: 'Post updated succesfully' })
  } catch (error) {
    next(error)
  }
}

exports.deletePost = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!id) {
      const error = new Error('No post id provided')
      error.statusCode = 400
      throw error
    }
    const post = await Post.findByIdAndDelete(id)

    //clear the post from the user's posts array
    const user = await User.findById(post.creator)
    user.posts = user.posts.filter(post => !post._id.equals(id))
    await user.save()

    io.getIO().emit('posts', {
      action: 'delete',
      post,
    })

    res.json({ message: 'Post deleted successfully', post })
  } catch (error) {
    next(error)
  }
}
