const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const path = require('path')
const { graphqlHTTP } = require('express-graphql')
const graphqlSchema = require('./graphql/schema')
const graphqlResolver = require('./graphql/resolvers')
const { auth } = require('./middleware/auth')
const AppError = require('./AppError')
const multer = require('multer')

const app = express()
const dbUrl = 'mongodb+srv://szymonix:szymonix@atlascluster.0207bfc.mongodb.net/node-course-posts-app?retryWrites=true&w=majority'

app.use(cors())
app.use(bodyParser.json())
app.use('/images', express.static(path.join(__dirname, 'images')))

//routes
// const feedRoutes = require('./routes/feed')
// const authRoutes = require('./routes/auth')
// const statusRoutes = require('./routes/status')
// app.use('/feed', feedRoutes)
// app.use(authRoutes)
// app.use('/status', statusRoutes)

app.use(auth)

const upload = require('./middleware/multer')

app.put('/post-image', upload.single('image'), (req, res) => {  
  if (!req.isAuth) {
    throw new AppError('Not authenticated', 401)
  }

  console.log(req.file);

  if(req.body.oldPath) {
    //clear old image
  }
  
  res.json({message: "image posted succesfully", filename: req.file.filename})
})

app.use(
  '/graphql',
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    customFormatErrorFn(err) {
      console.log(err)
      if (!err.originalError) {
        return err
      }
      const { message = 'Something went wrong!', statusCode = 500, errors } = err.originalError

      return {
        message,
        statusCode,
        errors,
      }
    },
  })
)

//error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      err.statusCode = 400
    }
  }
  const { message, statusCode = 500 } = err
  res.status(statusCode).json({ message })
})

mongoose
  .connect(dbUrl)
  .then(() => {
    console.log('Connected to the db')
  })
  .catch(err => {
    console.log(err)
  })

const server = app.listen(8080)

const io = require('./socket').init(server)

io.on('connection', socket => {
  console.log('Client connected')
})
