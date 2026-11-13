export function errorHandler(err, _req, res, _next) {
  console.error(err);
  if (err.code === 11000) return res.status(409).json({ message: 'A record with this barcode or email already exists' });
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
}
