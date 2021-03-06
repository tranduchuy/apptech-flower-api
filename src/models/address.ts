import { pre, prop, Ref, Typegoose } from 'typegoose';
import { Shop } from './shop';
import { User } from './user';

@pre<Address>('save', function (next) {
  this.updatedAt = new Date();
  next();
})
export class Address extends Typegoose {
  @prop({})
  name: string;

  @prop({})
  address: string;

  @prop({})
  addressText: string;

  @prop({})
  city: string;

  @prop({})
  district: number;

  @prop({})
  ward?: number;

  @prop({})
  type: number;

  @prop({})
  phone: string;

  @prop({})
  email: string;

  @prop({})
  latitude: number;

  @prop({})
  longitude: number;

  @prop({default: new Date()})
  updatedAt: Date;

  @prop({default: new Date()})
  createdAt: Date;

  @prop()
  user: Ref<User>;

  @prop()
  shop: Ref<Shop>;
}

export default new Address().getModelForClass(Address);