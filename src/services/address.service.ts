import { injectable } from 'inversify';
import mongoose from 'mongoose';
import AddressModel, { Address } from '../models/address';
import { General } from '../constant/generals';
import AddressTypes = General.AddressTypes;
import { SearchSelector } from '../constant/search-selector.constant';
import Cities = SearchSelector.Cities;

@injectable()
export class AddressService {
  listDeliveryAddressFields = ['name', 'user', 'phone', 'city', 'district', 'ward', 'address', 'addressText'];
  listPossibleDeliveryAddressFields = ['city', 'district'];
  createDeliveryAddress = async ({name, user, phone, address, latitude, longitude}) => {
    const newAddress = new AddressModel({
      name,
      phone,
      address,
      addressText: address,
      latitude,
      longitude,
      user: user._id,
      type: AddressTypes.DELIVERY
    });

    return await newAddress.save();
  };

  createNoLoginDeliveryAddress = async ({name, phone, address, latitude, longitude}) => {
    const newAddress = new AddressModel({
      name,
      phone,
      address,
      latitude,
      longitude,
      addressText: address,
      user: null,
      type: AddressTypes.DELIVERY
    });

    return await newAddress.save();
  };

  createPossibleDeliveryAddress = async (addressData: { city: string; shopId: string; district: number }) => {
    const newAddress = new AddressModel({
      city: addressData.city,
      district: addressData.district,
      shop: new mongoose.Types.ObjectId(addressData.shopId),
      type: AddressTypes.POSSIBLE_DELIVERY
    });

    return await newAddress.save();
  };

  deleteOldPossibleDeliveryAddress = async (shopId: string) => {

    return await AddressModel.remove({ shop: shopId, type: AddressTypes.POSSIBLE_DELIVERY});
  };
  getDelieveryAddress = async (user) => {
    return await AddressModel.find({
      user: user._id,
      type: AddressTypes.DELIVERY
    }, this.listDeliveryAddressFields).sort({updatedAt: -1});
  };
  getPossibleDelieveryAddress = async (user) => {
    return await AddressModel.find({
      user: user._id,
      type: AddressTypes.POSSIBLE_DELIVERY
    }, this.listPossibleDeliveryAddressFields).sort({updatedAt: -1});
  };
  updateDeliveryAddress = async (addressId, {
    name,
    phone,
    address,
    longitude,
    latitude
  }) => {
    const newAddress = {
      name: name || null,
      phone: phone || null,
      address: address || null,
      addressText: address || null,
      longitude,
      latitude,
      updatedAt: new Date()
    };

    Object.keys(newAddress).map(key => {
      if (newAddress[key] === null) {
        delete newAddress[key];
      }
    });
    await AddressModel.findOneAndUpdate({_id: addressId}, newAddress);

    return await AddressModel.findById(addressId);
  };

  updateShopAddress = async (shopId, {
    city,
    district,
    ward,
    address,
    longitude,
    latitude
  }) => {
    const newAddress = {
      city: null,
      district: null,
      ward: null,
      address: address || null,
      addressText: address || null,
      longitude,
      latitude,
      updatedAt: new Date()
    };

    Object.keys(newAddress).map(key => {
      if (newAddress[key] === null) {
        delete newAddress[key];
      }
    });

    console.log(newAddress);

    return await AddressModel.findOneAndUpdate({shop: shopId, type: AddressTypes.SHOP_ADDRESS}, newAddress);
  };

  updateGeoAddress = async (address, {
    latitude, longitude
  }) => {
    address.latitude = latitude;
    address.longitude = longitude;

    return await address.save();
  };
  findDeliveryAddressById = async (addressId, userId) => {
    try {
      return await AddressModel.findOne({
        _id: addressId,
        user: userId
      });
    } catch (e) {
      console.log(e);
    }

  };
  findPossibleDeliveryAddress = async ({city, district, user}) => {
    try {
      return await AddressModel.findOne({
        city,
        district,
        type: AddressTypes.POSSIBLE_DELIVERY,
        user: user._id
      });
    } catch (e) {
      console.log(e);
    }
  };
  getShopPossibleDeliveryAddress = async (shopId: string) => {
    try {
      return await AddressModel.find({
        type: AddressTypes.POSSIBLE_DELIVERY,
        shop: shopId
      });
    } catch (e) {
      console.log(e);
    }
  };
  getShopAddress = async (shopId: string) => {
    try {
      return await AddressModel.findOne({
        type: AddressTypes.SHOP_ADDRESS,
        shop: shopId
      });
    } catch (e) {
      console.log(e);
    }
  };

  findAddressById = async (addressId, userId) => {
    try {
      return await AddressModel.findOne({
        _id: addressId,
        user: userId
      });
    } catch (e) {
      console.log(e);
    }
  };

  findDeliveryAddressByShopId = async (shopId) => {
    return await AddressModel.findOne({
      shop: new mongoose.Types.ObjectId(shopId),
      type: General.AddressTypes.SHOP_ADDRESS
    });
  };

  findAddress = async (addressId): Promise<Address | null> => {
    try {
      return await AddressModel.findOne({
        _id: addressId
      });
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  deleteAddress = async (id) => {
    try {
      return await AddressModel.findByIdAndRemove(id);
    } catch (e) {
      console.log(e);
    }
  };

  async createShopAddress(shopId: string, address: string, longitude: number, latitude: number) {
    const newAddress = new AddressModel({
      address,
      addressText: address,
      longitude,
      latitude,
      shop: new mongoose.Types.ObjectId(shopId),
      type: AddressTypes.SHOP_ADDRESS
    });

    return await newAddress.save();
  }

  getCityByCode(cd: string): any {
    return Cities.find(city => {
      return city.code === cd;
    });
  }

  getDistrictByValue(city: any, value: number): any {
    const district = city.districts || [];
    return district.find(d => {
      return d.id === value;
    });
  }

  getWardByValue(district: any, value: number): any {
    return district.wards.find(w => {
      return w.id === value;
    });
  }

}