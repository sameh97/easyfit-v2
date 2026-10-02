const Joi = require(`@hapi/joi`);

const logInSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(1).required(),
});

module.exports = {
  logInSchema,
};
