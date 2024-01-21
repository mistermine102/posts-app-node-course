const path = require('path')
const fs = require('fs')

exports.removeFile = filePath => {
  const absFilePath = path.join(__dirname, filePath)
  fs.unlink(absFilePath, function (err) {
    if (err) return console.log(err)
  })
}
