const User = require('../models/user')
const Post = require('../models/post')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const validator = require('validator')
const AppError = require('../AppError')
const Mongoose = require('mongoose')

module.exports = {
  async createUser({ userInput }) {
    const { email, name, password } = userInput

    //validation
    const errors = []
    if (!validator.isEmail(email)) {
      errors.push({ message: 'Invalid email.' })
    }
    if (validator.isEmpty(password) || !validator.isLength(password, { min: 6, max: 100 })) {
      errors.push({ message: 'Invalid password.' })
    }
    if (errors.length > 0) {
      throw new AppError('Validation failed.', 400, errors)
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      throw new AppError('User with that email already exists.', 400)
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = new User({
      email,
      name,
      password: hashedPassword,
    })
    const createdUser = await user.save()

    return {
      ...createdUser._doc,
      _id: createdUser._id.toString(),
    }
  },
  //login
  async login({ email, password }) {
    const user = await User.findOne({ email })

    if (!user) {
      throw new AppError('Invalid email or password.', 400)
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password)

    if (!isPasswordCorrect) {
      throw new AppError('Invalid email or password.', 400)
    }

    //generate token
    const token = jwt.sign({ _id: user._id.toString() }, 'secret')

    return {
      token,
      userId: user._id,
    }
  },
  //create post
  async createPost({ postInput }, req) {
    if (!req.isAuth) {
      throw new AppError('Not authenticated.', 400)
    }

    const { title, content, imageUrl } = postInput

    //validation
    const errors = []
    if (validator.isEmpty(title) || !validator.isLength(title, { min: 6, max: 100 })) {
      errors.push({ message: 'Invalid title.' })
    }
    if (validator.isEmpty(content) || !validator.isLength(content, { min: 6, max: 100 })) {
      errors.push({ message: 'Invalid content.' })
    }
    if (errors.length > 0) {
      throw new AppError('Validation failed.', 400, errors)
    }

    const creator = await User.findById(req.userId)

    if (!creator) {
      throw new AppError('Invalid user.', 400)
    }

    const post = new Post({
      title,
      content,
      imageUrl: 'images/' + imageUrl,
      creator: creator._id,
    })

    const savedPost = await post.save()
    creator.posts.push(post)
    await creator.save()

    return {
      ...savedPost._doc,
      _id: savedPost._doc._id.toString(),
      creator: creator._doc,
      createdAt: savedPost._doc.createdAt.toString(),
      updatedAt: savedPost._doc.updatedAt.toString(),
    }
  },
  async getPosts({ page }) {
    const postsPerPage = 2
    const totalPosts = await Post.countDocuments()

    const foundPosts = await Post.find()
      .skip(postsPerPage * (page - 1))
      .limit(postsPerPage)
      .populate('creator')

    //transform a post to be graphql suitable
    const posts = foundPosts.map(post => ({
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toString(),
      updatedAt: post.updatedAt.toString(),
      creator: {
        ...post.creator._doc,
        _id: post.creator._id.toString(),
      },
    }))

    return {
      posts,
      totalPosts,
    }
  },
  async getPost({ id }) {
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new AppError("Invalid post id.", 400)
    }

    const post = await Post.findById(id).populate('creator')

    if (!post) {
      throw new AppError("No post found.", 404)
    }

    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toString(),
      updatedAt: post.updatedAt.toString(),
      creator: {
        ...post.creator._doc,
        _id: post.creator._id.toString(),
      },
    }
  },
  async updatePost({ postInput }, req) {

    // if (!req.isAuth) {
    //   throw new AppError('Not authenticated.', 401)
    // }
    //authorize
    //...
    const { _id, title, content, imageUrl } = postInput
    console.log(_id);

    const foundPost = await Post.findById(_id).populate('creator')
    foundPost.title = title
    foundPost.content = content
    const savedPost = await foundPost.save()
    const post = {
      ...savedPost._doc,
      _id: savedPost._id.toString(),
      updatedAt: savedPost._id.toString(),
      createdAt: savedPost.createdAt.toString(),
      creator: {
        ...savedPost.creator._doc,
        _id: savedPost.creator._id.toString(),
      },
    }

    return {
      _id: post._id,
      title: post.title,
      content: post.content,
      imageUrl: post.imageUrl,
      creator: post.creator,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }
  },
  async deletePost({ postInput }, req) {
    // if (!req.isAuth) {
    //   throw new AppError('Not authenticated.', 400)
    // }

    const { _id } = postInput
    const post = await Post.findByIdAndDelete(_id)

    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toString(),
      updatedAt: post.updatedAt.toString(),
      creator: {
        ...post.creator._doc,
        _id: post.creator._id.toString(),
      },
    }
  }
}
