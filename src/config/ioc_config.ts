import 'reflect-metadata';

import { Container } from 'inversify';

import {
  UserController,
} from '../controllers';

import TYPES from '../constant/types';
import TAG from '../constant/tags';
import { SearchController } from '../controllers/SearchController';
import { SearchService } from '../services/search.service';
import { UserService } from '../services/user.service';
import { MailerService } from '../services/mailer.service';

import { CheckTokenMiddleware } from '../middlewares/check-token';
import { ProductController } from '../controllers/ProductController';
import { ProductService } from '../services/product.service';
import { ImageService } from '../services/image.service';

import { CartController } from '../controllers/CartController';
import { CartService } from '../services/cart.service';

const container = new Container();

// Bind Controller
container.bind<UserController>(TYPES.UserController).to(UserController).whenTargetNamed(TAG.UserController);
container.bind<ProductController>(TYPES.ProductController).to(ProductController).whenTargetNamed(TAG.ProductController);
container.bind<SearchController>(TYPES.SearchController).to(SearchController);
container.bind<CartController>(TYPES.CartController).to(CartController);

// Bind Service
container.bind<UserService>(TYPES.UserService).to(UserService);
container.bind<ProductService>(TYPES.ProductService).to(ProductService);
container.bind<MailerService>(TYPES.MailerService).to(MailerService);
container.bind<SearchService>(TYPES.SearchService).to(SearchService);
container.bind<ImageService>(TYPES.ImageService).to(ImageService);
container.bind<CartService>(TYPES.CartService).to(CartService);

// Bind model

// Bind Middleware
container.bind<CheckTokenMiddleware>(TYPES.CheckTokenMiddleware).to(CheckTokenMiddleware);

export default container;