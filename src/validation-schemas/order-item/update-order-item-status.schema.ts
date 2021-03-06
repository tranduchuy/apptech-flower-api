import Joi from '@hapi/joi';
import { Status } from '../../constant/status';

const UpdateOrderItemStatusValidationSchema = Joi.object().keys({
    status: Joi.number().required().valid([Status.ORDER_ITEM_ON_DELIVERY, Status.ORDER_ITEM_FINISHED]),
    orderItemIds: Joi.array().required().items(Joi.string()).min(1)
  }
);

export default UpdateOrderItemStatusValidationSchema;