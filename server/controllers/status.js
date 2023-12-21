const User = require('../models/user')

exports.getStatus = async (req, res, next) => {
  try {
    const { userId } = req.params
    const user = await User.findById(userId)
    res.json({ status: user.status })
  } catch (error) {
    next(error)
  }
}

exports.updateStatus = async (req, res, next) => {
  try {
    const { userId } = req.params
    const { status } = req.body
    await User.findByIdAndUpdate(userId, { status })

    res.json({ status })
  } catch (error) {
    next(error)
  }
}
