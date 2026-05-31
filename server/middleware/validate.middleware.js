export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body); // Validates and strips unknown fields
    next();
  } catch (error) {
    return res.status(400).json({
      message: "Validation Error",
      errors: error.errors.map(err => ({ field: err.path.join('.'), message: err.message }))
    });
  }
};
