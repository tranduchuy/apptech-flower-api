import { Request } from 'express';
import * as HttpStatus from 'http-status-codes';
import { inject } from 'inversify';
import { controller, httpGet, httpPut } from 'inversify-express-utils';
import { ResponseMessages } from '../../constant/messages';
import TYPES from '../../constant/types';
import { IRes } from '../../interfaces/i-res';
import { Order } from '../../models/order';
import UserModel from '../../models/user';
import OrderItemModel from '../../models/order-item';
import Joi from '@hapi/joi';
import ListOrderSchema from '../../validation-schemas/order/admin-list-order.schema';
import { OrderService } from '../../services/order.service';
import { ObjectID } from 'bson';
import AdminUpdateOrderStatusValidationSchema from '../../validation-schemas/order/admin-update-status-order.schema';
import { NotifyService } from '../../services/notify.service';
import { Status } from '../../constant/status';
import { SmsService } from '../../services/sms.service';
import { MailerService } from '../../services/mailer.service';
import { OrderItemService } from '../../services/order-item.service';

interface IResProducts {
  meta: {
    totalItems: number
  };
  orders: Order[];
}

@controller('/admin/order')
export class AdminOrderController {
  constructor(@inject(TYPES.OrderService) private orderService: OrderService,
              @inject(TYPES.OrderItemService) private orderItemService: OrderItemService,
              @inject(TYPES.SmsService) private smsService: SmsService,
              @inject(TYPES.MailerService) private mailerService: MailerService,
              @inject(TYPES.NotifyService) private notifyService: NotifyService) {

  }

  @httpGet('/', TYPES.CheckTokenMiddleware, TYPES.CheckAdminMiddleware)
  public getList(req: Request): Promise<IRes<any>> {
    return new Promise<IRes<any>>(async (resolve) => {
      try {
        const {error} = Joi.validate(req.query, ListOrderSchema);
        if (error) {
          const messages = error.details.map(detail => {
            return detail.message;
          });

          const result: IRes<any> = {
            status: HttpStatus.BAD_REQUEST,
            messages: messages
          };
          return resolve(result);
        }

        const {code, limit, page, status, sortBy, sortDirection} = req.query;
        const queryCondition = {
          code: code ? code : null,
          limit: parseInt((limit || 10).toString()),
          page: parseInt((page || 1).toString()),
          status: status ? parseInt(status) : null,
          sb: sortBy,
          sd: sortDirection,
        };
        const stages: any[] = this.orderItemService.buildStageGetListOrderItemAdmin(queryCondition);

        const result: any = await OrderItemModel.aggregate(stages);

        const response: IRes<any> = {
          status: HttpStatus.OK,
          messages: [ResponseMessages.SUCCESS],
          data: {
            meta: {
              totalItems: result[0].meta[0] ? result[0].meta[0].totalItems : 0,
              item: result[0].entries.length,
              limit: queryCondition.limit,
              page: queryCondition.page,
            },
            orders: result[0].entries
          }
        };

        return resolve(response);
      } catch (e) {
        console.error(e);
        const result: IRes<IResProducts> = {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          messages: [JSON.stringify(e)]
        };
        return resolve(result);
      }
    });
  }

  @httpPut('/status/:id', TYPES.CheckTokenMiddleware, TYPES.CheckAdminMiddleware)
  public updateOrderStatus(request: Request): Promise<IRes<Order>> {
    return new Promise<IRes<any>>(async (resolve) => {
      try {
        const {error} = Joi.validate(request.body, AdminUpdateOrderStatusValidationSchema);
        if (error) {
          const messages = error.details.map(detail => {
            return detail.message;
          });

          const result: IRes<Order> = {
            status: HttpStatus.BAD_REQUEST,
            messages: messages
          };

          return resolve(result);
        }

        const id = request.params.id;

        if (!ObjectID.isValid(id)) {
          const result = {
            status: HttpStatus.BAD_REQUEST,
            messages: [ResponseMessages.INVALID_ID]
          };
          return resolve(result);
        }

        const order = await this.orderService.findOrderById(id);
        if (!order) {
          const result = {
            status: HttpStatus.NOT_FOUND,
            messages: [ResponseMessages.Order.ORDER_NOT_FOUND]
          };

          return resolve(result);
        }

        const {status} = request.body;

        await this.orderService.updateStatus(order._id, status);
        const result: IRes<Order> = {
          status: HttpStatus.OK,
          messages: [ResponseMessages.SUCCESS],
          data: null
        };
        if (status === Status.ORDER_PAID) {
          // notify to user
          let phone;
          let email;
          if (order.buyerInfo !== null) {
            phone = order.buyerInfo.phone;
            email = order.buyerInfo.email;
          } else {
            const user = await UserModel.findOne({_id: order.fromUser});
            phone = user.phone;
            email = user.email;
          }

          this.mailerService.sendPaymentSuccesEmail(email, order.code);
          this.smsService.sendPaymentSuccessSMS(phone, order.code);

          // notify to shop
          await this.notifyService.notifyNewOrderToShops(order._id);
        }

        return resolve(result);
      } catch (e) {
        console.error(e);
        const result: IRes<IResProducts> = {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          messages: [JSON.stringify(e)]
        };
        return resolve(result);
      }
    });
  }
}
