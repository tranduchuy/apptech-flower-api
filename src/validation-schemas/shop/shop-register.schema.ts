import Joi from '@hapi/joi';

const shopShipAddress = Joi.object().keys({
  city: Joi.string().required(),
  district: Joi.number()
});


const RegisterShop = Joi.object().keys(
  {
    name: Joi.string().required(),
    slug: Joi.string().required(),
    images: Joi.array().required().items(Joi.string()),
    availableShipCountry: Joi.boolean().required(),
    availableShipAddresses: Joi.array().items(shopShipAddress),
    address: Joi.string().required(),
    longitude: Joi.number().required(),
    latitude: Joi.number().required()
  }
);

export default RegisterShop;