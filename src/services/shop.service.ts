import { injectable } from 'inversify';
import mongoose from 'mongoose';
import { Status } from '../constant/status';
import ShopModel, { Shop } from '../models/shop.model';
import ImageShopModel, { ImageShop } from '../models/image-shop.model';
import { Op } from 'sequelize';
import User from '../models/user.model';
import ShopHasProduct from '../models/shop-has-product.model';

export interface IQueryWaitingShop {
  limit: number;
  page: number;
  sortBy?: string;
  sortDirection?: string;
  userId?: string;
}

export interface IQueryProductsOfShop {
  limit: number;
  page: number;
  sortBy?: string;
  sortDirection?: string;
  status?: number;
  approvedStatus?: number;
  title?: string;
  shopId: number;
}

export interface IQueryListShop {
  name: string;
  limit: number;
  page: number;
  status: number;
  sb?: string;
  sd?: string;
}

@injectable()
export class ShopService {

  async findShopById(shopId: number): Promise<Shop> {
    return await ShopModel.findOne({ where: { id: shopId } });
  }

  async findShopOfUser(userId: number): Promise<Shop> {
    const user: any = await User.findOne({ where: { id: userId } });
    return await ShopModel.findOne(
      {
        where: {
          id: user.shopsId,
          status: Status.ACTIVE
        }
      }
    );
  }

  async findShopBySlug(slug: string): Promise<Shop> {
    return await ShopModel.findOne({ where: { slug } });
  }

  buildQueryGetProductsOfShop(queryCondition: IQueryProductsOfShop) {
    const cond: any = {};

    if (queryCondition.approvedStatus)
      cond.approvedStatus = queryCondition.approvedStatus;

    if (queryCondition.status)
      cond.status = queryCondition.status;
    else
      cond.status = {
        [Op.ne]: Status.DELETE
      };

    if (queryCondition.title) {
      cond.title = {
        [Op.like]: queryCondition.title
      };
    }

    const order = [];
    if (queryCondition.sortBy) {
      order.push(queryCondition.sortBy);
      order.push(queryCondition.sortDirection);
    }

    return {
      where: cond,
      order: [order],
      offset: (queryCondition.page - 1) * queryCondition.limit,
      limit: queryCondition.limit,
      include: [
        {
          model: ShopHasProduct,
          as: 'shopHasProductInfo',
          duplicating: false
        }
      ]
    };
  }

  async createNewShop(name: string, slug: string, images: string[], availableShipCountry: boolean): Promise<Shop> {
    const shop = new ShopModel({
      name,
      slug,
      availableShipCountry,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await shop.save();

    await Promise.all((images || [])
      .map(async (imageUrl: string) => {
        await this.createImageShop(shop.id, imageUrl);
      }));

    return shop;
  }

  createImageShop = async (shopId: number, imageUrl: string): Promise<ImageShop> => {
    const newImage = new ImageShopModel({
      imageUrl,
      shopsId: shopId
    });
    return await newImage.save();
  };

  async updateShop(shop: Shop, availableShipCountry: boolean): Promise<Shop> {
    if (availableShipCountry) {
      shop.availableShipCountry = availableShipCountry;
    }
    return await shop.save();
  }

  buildStageQueryShopWaiting(queryCondition: IQueryWaitingShop): any[] {
    const stages = [];

    if (queryCondition.userId) {
      stages.push({
        $match: {
          user: queryCondition.userId
        }
      });
    }

    if (queryCondition.sortBy) {
      stages.push({
        $sort: {
          [queryCondition.sortBy]: queryCondition.sortDirection || 'ASC'
        }
      });
    }

    stages.push({
      $facet: {
        entries: [
          { $skip: (queryCondition.page - 1) * queryCondition.limit },
          { $limit: queryCondition.limit }
        ],
        meta: [
          { $group: { _id: null, totalItems: { $sum: 1 } } },
        ],
      }
    });

    return stages;
  }

  buildStageQueryProductOfShop(queryCondition: IQueryProductsOfShop): any[] {
    const stages = [];

    const matchStage = {
      shop: new mongoose.Types.ObjectId(queryCondition.shopId)
    };
    if (queryCondition.approvedStatus) {
      matchStage['approvedStatus'] = queryCondition.approvedStatus;
    }
    if (queryCondition.status) {
      matchStage['status'] = queryCondition.status;
    } else {
      matchStage['status'] = {
        $ne: Status.DELETE
      };
    }

    if (queryCondition.title) {
      matchStage['title'] = {
        $regex: queryCondition.title,
        $options: 'i'
      };
    }

    stages.push({
      $match: matchStage
    });

    if (queryCondition.sortBy) {
      stages.push({
        $sort: {
          [queryCondition.sortBy]: queryCondition.sortDirection === 'ASC' ? 1 : -1
        }
      });
    } else {
      stages.push({
        $sort: {
          'updatedAt': -1
        }
      });
    }

    stages.push({
      $facet: {
        entries: [
          { $skip: (queryCondition.page - 1) * queryCondition.limit },
          { $limit: queryCondition.limit }
        ],
        meta: [
          { $group: { _id: null, totalItems: { $sum: 1 } } },
        ],
      }
    });

    return stages;
  }

  buildQueryGetListShop(queryCondition: IQueryListShop): any {
    const cond: any = {};

    if (queryCondition.name) {
      cond.name = {
        [Op.like]: queryCondition.name
      };
    }

    const order = [];
    if (queryCondition.sb) {
      order.push(queryCondition.sb);
      order.push(queryCondition.sd);
    }

    return {
      where: cond,
      order: [order],
      offset: (queryCondition.page - 1) * queryCondition.limit,
      limit: queryCondition.limit,
      include: [
        { model: User, as: 'userInfo', duplicating: false }
      ]
    };
  }

  buildStageGetListShop(queryCondition: IQueryListShop): any[] {
    const stages = [];
    const matchStage: any = {};

    if (queryCondition.name) {
      matchStage['name'] = { '$regex': queryCondition.name, '$options': 'i' };
    }

    if (queryCondition.status) {
      matchStage['status'] = queryCondition.status;
    }

    if (Object.keys(matchStage).length > 0) {
      stages.push({ $match: matchStage });
    }

    stages.push({
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userInfo'
      }
    });

    stages.push({ $unwind: { path: '$userInfo' } });

    if (queryCondition.sb) {
      stages.push({
        $sort: {
          [queryCondition.sb]: queryCondition.sd === 'ASC' ? 1 : -1
        }
      });
    }

    stages.push({
      $facet: {
        entries: [
          { $skip: (queryCondition.page - 1) * queryCondition.limit },
          { $limit: queryCondition.limit }
        ],
        meta: [
          { $group: { _id: null, totalItems: { $sum: 1 } } },
        ],
      }
    });

    return stages;
  }
}
