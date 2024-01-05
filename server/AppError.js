module.exports = class AppError extends Error {

  constructor(message = "Something went wrong", status = "500", errors = []) {
    super(message)
    this.statusCode = status
    this.errors = errors
  }
}
