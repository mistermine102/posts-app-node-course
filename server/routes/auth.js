// const express = require('express')
// const router = express.Router()
// const { body } = require('express-validator')
// const User = require('../models/user')

// const authController = require('../controllers/auth')

// router.post(
//   '/signup',
//   [
//     body('email')
//       .isEmail()
//       .withMessage('Invalid email.')
//       .custom((value, { req }) => {
//         return User.findOne({ email: value }).then(userDoc => {
//           if (userDoc) {
//             return Promise.reject('User with that email already exists.')
//           }
//         })
//       })
//       .normalizeEmail(),
//     body('password').trim().isLength({ min: 5 }),
//     body('name').trim().not().isEmpty(),
//   ],
//   authController.signup
// )

// router.post("/signin", authController.signin)

// module.exports = router
