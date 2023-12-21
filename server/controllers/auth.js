const { validationResult } = require('express-validator')
const User = require('../models/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

exports.signup = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const error = new Error('Validation failed.')
      error.statusCode = 422
      error.data = errors.array()
      throw error
    }

    const { email, password, name } = req.body

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = new User({
      name,
      email,
      password: hashedPassword,
    })

    const result = user.save()
    res.json({ message: 'User created succesfully.', userId: result._id })
  } catch (error) {
    next(error)
  }
}

exports.signin = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) {
      const error = new Error('Invalid email or password!')
      error.statusCode = 401
      throw error
    }
    const isCorrectPassword = await bcrypt.compare(password, user.password)
    if (!isCorrectPassword) {
      const error = new Error('Invalid email or password!')
      error.statusCode = 401
      throw error
    }
    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString(),
      },
      'secret',
      { expiresIn: '1h' }
    )
    res.json({ token, userId: user._id.toString() })
  } catch (error) {
    next(error)
  }
}
