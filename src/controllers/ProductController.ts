import {
  controller, httpGet, httpPost, httpPut
} from 'inversify-express-utils';
import { inject } from 'inversify';
import TYPES from '../constant/types';
import { Request, Response } from 'express';
import { IRes } from '../interfaces/i-res';
import { ProductService } from '../services/product.service';
import * as HttpStatus from 'http-status-codes';
import ProductModel, { Product } from '../models/product';
import { General } from '../constant/generals';
import UserTypes = General.UserTypes;
import Joi from '@hapi/joi';
import mongoose from 'mongoose';
import { ShopService } from '../services/shop.service';
// validate schema
import addProductSchema from '../validation-schemas/product/add-new.schema';
import updateProductSchema from '../validation-schemas/product/update-one.schema';
import updateStatusValidationSchema from '../validation-schemas/product/update-status.schema';
import { ResponseMessages } from '../constant/messages';
import { ImageService } from '../services/image.service';
import GetInfoByIdsValidationSchema from '../validation-schemas/product/get-info-by-ids.schema';
import { ProductWorkerService } from '../services/product-worker.service';
import ListProductsValidationSchema from '../validation-schemas/product/list-products.schema';

interface IResUpdateProductsStatus {
  notFoundProducts?: string[];
}

@controller('/product')
export class ProductController {
  constructor(
      @inject(TYPES.ProductService) private productService: ProductService,
      @inject(TYPES.ImageService) private imageService: ImageService,
      @inject(TYPES.ShopService) private shopService: ShopService,
      @inject(TYPES.ProductWorkerService) private productWorkerService: ProductWorkerService
  ) {
    this.productWorkerService.runChangeProductSaleOffJob();
  }

  @httpGet('/', TYPES.CheckTokenMiddleware)
  public getProducts(request: Request, response: Response): Promise<IRes<Product[]>> {
    return new Promise<IRes<Product[]>>(async (resolve, reject) => {
      try {
        const user = request.user;
        const shop: any = await this.shopService.findShopOfUser(user._id.toString());
        const result: IRes<Product[]> = {
          status: 1,
          messages: [ResponseMessages.SUCCESS],
          data: await ProductModel.find({
            shop: shop._id
          }).limit(20)
        };

        return resolve(result);
      } catch (e) {
        console.error(e);
        const result: IRes<Product[]> = {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          messages: [JSON.stringify(e)],
        };
        return resolve(result);
      }
    });
  }


  @httpGet('/detail/:id', TYPES.CheckTokenMiddleware)
  public getProductDetail(request: Request, response: Response): Promise<IRes<{}>> {
    return new Promise<IRes<{}>>(async (resolve, reject) => {
      try {
        const id = request.params.id;
        const product = await this.productService.getProductDetailById(id);
        const shop = product.shop;

        if (!product || shop.user.toString() !== request.user._id.toString()) {
          const result: IRes<{}> = {
            status: HttpStatus.NOT_FOUND,
            messages: [ResponseMessages.Product.PRODUCT_NOT_FOUND],
            data: {}
          };

          return resolve(result);
        }

        const result: IRes<{}> = {
          status: HttpStatus.OK,
          messages: [ResponseMessages.SUCCESS],
          data: product
        };
        return resolve(result);
      } catch (e) {
        console.error(e);
        const result: IRes<{}> = {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          messages: [JSON.stringify(e)],
        };
        return resolve(result);
      }
    });
  }


  @httpGet('/home')
  public getHomeProducts(): Promise<IRes<{}>> {
    return new Promise<IRes<{}>>(async (resolve) => {
      try {
        const featuredProducts = await this.productService.getFeaturedProducts();
        const saleProducts = await this.productService.getSaleProducts();
        const newProducts = await this.productService.getNewProducts();

        const result: IRes<{}> = {
          status: HttpStatus.OK,
          messages: [ResponseMessages.Product.Add.ADD_PRODUCT_SUCCESS],
          data: {
            meta: {},
            entries: {
              featuredProducts: featuredProducts,
              saleProducts: saleProducts,
              newProducts
            }
          }
        };

        return resolve(result);
      } catch (e) {
        console.error(e);
        const result: IRes<{}> = {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          messages: [JSON.stringify(e)],
        };
        return resolve(result);
      }
    });
  }

  @httpGet('/info')
  public getInfoByIds(request: Request): Promise<IRes<{}>> {
    return new Promise<IRes<{}>>(async (resolve) => {
      try {
        const {error} = Joi.validate(request.query, GetInfoByIdsValidationSchema);
        if (error) {
          const messages = error.details.map(detail => {
            return detail.message;
          });

          const result: IRes<{}> = {
            status: HttpStatus.BAD_REQUEST,
            messages: messages,
            data: {}
          };

          return resolve(result);
        }
        const {productIds} = request.query;
        const productIdsArray = productIds.split(',');

        const products = await this.productService.findProductsByProductIds(productIdsArray);

        const result: IRes<{}> = {
          status: HttpStatus.OK,
          messages: [ResponseMessages.SUCCESS],
          data: {
            meta: {},
            entries: {
              products: products
            }
          }
        };

        return resolve(result);
      } catch (e) {
        console.error(e);
        const result: IRes<{}> = {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          messages: [JSON.stringify(e)],
        };
        return resolve(result);
      }
    });
  }

  @httpGet('/featured')
  public getFeaturedProducts(req: Request): Promise<IRes<{}>> {
    return new Promise<IRes<{}>>(async (resolve) => {
      try {
        const {error} = Joi.validate(req.query, ListProductsValidationSchema);
        if (error) {
          const messages = error.details.map(detail => {
            return detail.message;
          });

          const result: IRes<{}> = {
            status: HttpStatus.BAD_REQUEST,
            messages: messages,
            data: {}
          };
          return resolve(result);
        }

        const {limit, page, sb, sd} = req.query;
        const queryCondition = {
          limit: parseInt((limit || 10).toString()),
          page: parseInt((page || 1).toString()),
          sortBy: sb || null,
          sortDirection: sd || null
        };

        const result = await this.productService.listFeaturedProducts(queryCondition);

        const products = this.productService.mappingListProducts(result[0].entries);

        const resultSuccess: IRes<any> = {
          status: HttpStatus.OK,
          messages: [ResponseMessages.SUCCESS],
          data: {
            meta: {
              totalItems: result[0].meta[0] ? result[0].meta[0].totalItems : 0,
              item: result[0].entries.length,
              limit: queryCondition.limit,
              page: queryCondition.page,
            },
            products: products
          }
        };

        return resolve(resultSuccess);
      } catch (e) {
        console.error(e);
        const result: IRes<{}> = {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          messages: [JSON.stringify(e)],
        };
        return resolve(result);
      }
    });
  }

  @httpGet('/sale')
  public getSaleProducts(req: Request): Promise<IRes<{}>> {
    return new Promise<IRes<{}>>(async (resolve) => {
      try {
        const {error} = Joi.validate(req.query, ListProductsValidationSchema);
        if (error) {
          const messages = error.details.map(detail => {
            return detail.message;
          });

          const result: IRes<{}> = {
            status: HttpStatus.BAD_REQUEST,
            messages: messages,
            data: {}
          };
          return resolve(result);
        }

        const {limit, page, sb, sd} = req.query;
        const queryCondition = {
          limit: parseInt((limit || 10).toString()),
          page: parseInt((page || 1).toString()),
          sortBy: sb || null,
          sortDirection: sd || null
        };

        const result = await this.productService.listSaleProducts(queryCondition);

        const products = this.productService.mappingListProducts(result[0].entries);

        const resultSuccess: IRes<any> = {
          status: HttpStatus.OK,
          messages: [ResponseMessages.SUCCESS],
          data: {
            meta: {
              totalItems: result[0].meta[0] ? result[0].meta[0].totalItems : 0,
              item: result[0].entries.length,
              limit: queryCondition.limit,
              page: queryCondition.page,
            },
            products: products
          }
        };

        return resolve(resultSuccess);
      } catch (e) {
        console.error(e);
        const result: IRes<{}> = {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          messages: [JSON.stringify(e)],
        };
        return resolve(result);
      }
    });
  }

  @httpPost('/', TYPES.CheckTokenMiddleware)
  public addOne(request: Request): Promise<IRes<{}>> {
    return new Promise<IRes<{}>>(async (resolve) => {
      try {
        const {error} = Joi.validate(request.body, addProductSchema);
        if (error) {
          const messages = error.details.map(detail => {
            return detail.message;
          });

          const result: IRes<{}> = {
            status: HttpStatus.BAD_REQUEST,
            messages: messages,
            data: {}
          };
          return resolve(result);
        }

        const user = request.user;
        const {
          title, sku, description, images, topic, salePrice, originalPrice,
          keywordList, startDate, endDate, saleActive, freeShip,
          design, specialOccasion, floret, status, city, district, color, seoUrl, seoDescription, seoImage
        } = request.body;

        if (user.type !== UserTypes.TYPE_SELLER) {
          const result: IRes<{}> = {
            status: HttpStatus.BAD_REQUEST,
            messages: [ResponseMessages.Product.Add.NO_ADD_PRODUCT_PERMISSION],
            data: {}
          };
          return resolve(result);
        }

        // check sale price vs original price.
        if (Number(salePrice) > Number(originalPrice)) {
          const result: IRes<{}> = {
            status: HttpStatus.BAD_REQUEST,
            messages: [ResponseMessages.Product.NOT_VALID_PRICE],
            data: {}
          };
          return resolve(result);
        }

        const shop: any = await this.shopService.findShopOfUser(request.user._id.toString());

        const newProduct = await this.productService.createProduct({
          title,
          sku,
          description,
          topic,
          saleActive,
          freeShip,
          startDate: startDate || null,
          endDate: endDate || null,
          originalPrice,
          status,
          shopId: shop._id.toString(),
          keywordList: keywordList || [],
          salePrice: salePrice || null,
          images: images || [],
          design: design || null,
          specialOccasion: specialOccasion || null,
          floret: floret || null,
          city: city || null,
          district: district || null,
          color: color || null,
          seoUrl: seoUrl || null,
          seoDescription: seoDescription || null,
          seoImage: seoImage || null
        });

        // confirm images
        const paths = newProduct.images || [];

        if (paths.length > 0) {
          this.imageService.confirmImages(newProduct.images);
        }

        const result: IRes<{}> = {
          status: HttpStatus.OK,
          messages: [ResponseMessages.Product.Add.ADD_PRODUCT_SUCCESS],
          data: {
            meta: {},
            entries: [newProduct]
          }
        };
        return resolve(result);
      } catch (e) {
        console.error(e);
        const result: IRes<{}> = {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          messages: [JSON.stringify(e)],
        };
        return resolve(result);
      }
    });
  }

  @httpPut('/:id', TYPES.CheckTokenMiddleware)
  public updateOne(request: Request): Promise<IRes<{}>> {
    return new Promise<IRes<{}>>(async (resolve) => {
      try {
        const {error} = Joi.validate(request.body, updateProductSchema);
        if (error) {
          const messages = error.details.map(detail => {
            return detail.message;
          });

          const result: IRes<{}> = {
            status: HttpStatus.BAD_REQUEST,
            messages: messages,
            data: {}
          };
          return resolve(result);
        }

        const id = request.params.id;
        const product = await this.productService.getProductDetailById(id);
        if (!product || product.shop.user.toString() !== request.user._id.toString()) {
          const result: IRes<{}> = {
            status: HttpStatus.NOT_FOUND,
            messages: [ResponseMessages.Product.PRODUCT_NOT_FOUND],
            data: {}
          };

          return resolve(result);
        }

        if (request.user.type !== UserTypes.TYPE_SELLER) {
          const result: IRes<{}> = {
            status: HttpStatus.BAD_REQUEST,
            messages: [ResponseMessages.Product.Update.NO_UPDATE_PRODUCT_PERMISSION],
            data: {}
          };
          return resolve(result);
        }

        const {
          title, sku, description, images, topic, salePrice, originalPrice,
          keywordList, startDate, endDate, saleActive, freeShip,
          design, specialOccasion, floret, city, district, color, seoUrl, seoDescription, seoImage
        } = request.body;

        let saleOff;

        const saleOffObject = product.saleOff;


        if (salePrice && salePrice !== product.saleOff.price) {
          if (salePrice === 0) {
            saleOff = {
              price: 0,
              startDate: null,
              endDate: null,
              active: false
            };
          } else {
            saleOff = {
              price: salePrice,
              startDate: Date.now(),
              endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
              active: true
            };
          }
        } else {
          saleOff = saleOffObject;
        }
        if (saleActive) {
          if (salePrice) {
            saleOff.price = salePrice;
          }
          if (startDate) {
            saleOff.startDate = startDate;
          }

          if (endDate) {
            saleOff.endDate = endDate;
          }
        } else {
          saleOff.active = false;
        }


        const salePriceCheck = salePrice || product.saleOff.price;
        const price = originalPrice || product.originalPrice;
        // check sale price vs original price.
        if (Number(salePriceCheck) > Number(price)) {
          const result: IRes<{}> = {
            status: HttpStatus.BAD_REQUEST,
            messages: [ResponseMessages.Product.NOT_VALID_PRICE],
            data: {}
          };
          return resolve(result);
        }

        const oldImages = product.images || [];
        const newImages = images;

        await this.productService.updateProduct(product, {
          title,
          sku,
          description,
          topic,
          originalPrice,
          keywordList,
          saleOff,
          images,
          design,
          specialOccasion,
          floret,
          city,
          district,
          color,
          seoUrl,
          seoDescription,
          seoImage,
          freeShip
        });

        // update images on static server
        if (newImages) {
          this.imageService.updateImages(oldImages, newImages);
        }

        const result: IRes<{}> = {
          status: HttpStatus.OK,
          messages: [ResponseMessages.Product.Update.UPDATE_PRODUCT_SUCCESS],
          data: {
            meta: {},
            entries: []
          }
        };

        return resolve(result);
      } catch (e) {
        console.error(e);
        const result: IRes<{}> = {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          messages: [JSON.stringify(e)],
        };
        return resolve(result);
      }
    });
  }

  @httpPost('/status', TYPES.CheckTokenMiddleware, TYPES.CheckUserTypeSellerMiddleware)
  public updateStatus(request: Request): Promise<IRes<IResUpdateProductsStatus>> {
    return new Promise<IRes<{}>>(async (resolve) => {
      try {
        const {error} = Joi.validate(request.body, updateStatusValidationSchema);
        if (error) {
          const messages = error.details.map(detail => {
            return detail.message;
          });

          const result: IRes<IResUpdateProductsStatus> = {
            status: HttpStatus.BAD_REQUEST,
            messages: messages
          };
          return resolve(result);
        }

        const {productIds, status} = request.body;
        const shop = await this.shopService.findShopOfUser(request.user._id.toString());
        if (!shop) {
          const result: IRes<{}> = {
            status: HttpStatus.NOT_FOUND,
            messages: [ResponseMessages.Shop.SHOP_OF_USER_NOT_FOUND],
          };

          return resolve(result);
        }

        const notFoundProducts: string[] = [];
        await Promise.all(productIds.map(async (productId: string) => {
          const product = await ProductModel.findOne({
            _id: new mongoose.Types.ObjectId(productId),
            shop: new mongoose.Types.ObjectId(shop._id.toString())
          });

          if (!product) {
            notFoundProducts.push(productId);
          } else {
            product.status = status;
            await product.save();
          }
        }));

        if (notFoundProducts.length !== 0) {
          const result: IRes<IResUpdateProductsStatus> = {
            status: HttpStatus.OK,
            messages: [ResponseMessages.Product.PRODUCT_NOT_FOUND],
            data: {notFoundProducts}
          };

          return resolve(result);
        }

        const result: IRes<IResUpdateProductsStatus> = {
          status: HttpStatus.OK,
          messages: [ResponseMessages.Product.Update.UPDATE_PRODUCT_SUCCESS],
          data: {}
        };

        return resolve(result);
      } catch (e) {
        console.error(e);
        const result: IRes<{}> = {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          messages: [JSON.stringify(e)],
        };
        return resolve(result);
      }
    });
  }


}
