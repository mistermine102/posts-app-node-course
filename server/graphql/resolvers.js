const User = require('../models/user')
const Post = require('../models/post')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const validator = require('validator')

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
      const error = new Error('Validation failed.')
      error.errors = errors
      error.statusCode = 400
      throw error
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      const error = new Error('User with that email already exists.')
      throw error
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

  //create post
  async createPost({ postInput }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated.')
      error.statusCode = 400
      throw error
    }

    const { title, content } = postInput

    //validation
    const errors = []
    if (validator.isEmpty(title) || !validator.isLength(title, { min: 6, max: 100 })) {
      errors.push({ message: 'Invalid title.' })
    }
    if (validator.isEmpty(content) || !validator.isLength(content, { min: 6, max: 100 })) {
      errors.push({ message: 'Invalid content.' })
    }
    if (errors.length > 0) {
      const error = new Error('Validation failed.')
      error.errors = errors
      error.statusCode = 400
      throw error
    }

    const creator = await User.findById(req.userId)

    if (!creator) {
      const error = new Error('Invalid user')
      error.statusCode = 400
      throw error
    }

    const post = new Post({
      title,
      content,
      imageUrl: 'test',
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

  //login
  async login({ email, password }) {
    const user = await User.findOne({ email })

    if (!user) {
      const error = new Error('Invalid email or password.')
      error.statusCode = 400
      throw error
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password)

    if (!isPasswordCorrect) {
      const error = new Error('Invalid email or password.')
      error.statusCode = 400
      throw error
    }

    //generate token
    const token = jwt.sign({ _id: user._id.toString() }, 'secret')

    return {
      token,
      userId: user._id,
    }
  },
  async getPosts({ page }, req) {
    if(!req.isAuth) {
      const error = new Error("Not autheticated.")
      error.statusCode = 401
      throw error
    }

    const postsPerPage = 2
    const totalPosts = await Post.countDocuments()

    const foundPosts = await Post.find().skip(postsPerPage * (page-1)).limit(postsPerPage).populate('creator')

    //transform a post to be graphql suitable
    const posts = foundPosts.map(post => ({
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toString(),
      updatedAt: post.updatedAt.toString(),
      creator: {
        ...post.creator._doc,
        _id: post.creator._id.toString()
      }
    }))

    return {
      posts,
      totalPosts,
    }
  },
}
