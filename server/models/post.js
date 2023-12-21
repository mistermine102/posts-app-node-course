const mongoose = require('mongoose')

const postSchema = new mongoose.Schema(
  {
    title: String,
    content: String,
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    imageUrl: String,
  },
  { timestamps: true }
)

module.exports = mongoose.model('Post', postSchema)
