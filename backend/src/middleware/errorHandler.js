function notFound(_req, _res, next) {
  const error = new Error('Resource not found');
  error.statusCode = 404;
  next(error);
}

function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal server error',
    details: err.details || undefined,
  });
}

module.exports = { notFound, errorHandler };
