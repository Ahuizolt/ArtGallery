const { body, validationResult } = require('express-validator');

const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('El username debe tener entre 3 y 30 caracteres'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('El email debe tener un formato válido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La password debe tener al menos 6 caracteres'),
];

const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('El email debe tener un formato válido'),
  body('password')
    .notEmpty()
    .withMessage('La password es requerida'),
];

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg, errors: errors.array() });
  }
  next();
}

module.exports = { validateRegister, validateLogin, handleValidationErrors };
