import Joi from '@hapi/joi';
const LoginValidationSchema = Joi.object().keys({
      email: Joi.string().max(100).email(),
      username: Joi.string().min(6).max(100),
      password: Joi.string().min(6).max(100)
    }
);

export default LoginValidationSchema;