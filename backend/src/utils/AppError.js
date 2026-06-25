class AppError extends Error {
  constructor(message, statusCode = 500, errors = null, code = 'APP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;
    this.isOperational = true;
  }
}

class InsufficientStockError extends AppError {
  constructor(message = 'Insufficient stock for allocation') {
    super(message, 400, null, 'INSUFFICIENT_STOCK');
  }
}

class InvalidBatchError extends AppError {
  constructor(message = 'Invalid or inactive batch') {
    super(message, 400, null, 'INVALID_BATCH');
  }
}

module.exports = { AppError, InsufficientStockError, InvalidBatchError };
