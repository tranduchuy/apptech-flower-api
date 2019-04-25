import { injectable } from 'inversify';
import UserModel from '../models/user';
import { UserConstant } from '../constant/users';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import RandomString from 'randomstring';
import { Status } from '../constant/status';
import { General } from '../constant/generals';
import UserRoles = General.UserRoles;
import UserTypes = General.UserTypes;
import RegisterByTypes = General.RegisterByTypes;

@injectable()
export class UserService {
  sellerInProductDetailFields = ['_id', 'avatar', 'name', 'address'];
  createUser = async ({email, password, type, name, username, phone, address, city, district, ward, registerBy, gender, role}) => {
    const salt = bcrypt.genSaltSync(UserConstant.saltLength);
    const tokenEmailConfirm = RandomString.generate({
      length: UserConstant.tokenConfirmEmailLength,
      charset: 'alphabetic'
    });

    const newUser = new UserModel({
      email,
      passwordHash: bcrypt.hashSync(password, salt),
      passwordSalt: salt,
      type,
      name,
      username,
      phone,
      tokenEmailConfirm,
      registerBy,
      status: Status.PENDING_OR_WAIT_COMFIRM,
      address: address || '',
      city: city || null,
      district: district || null,
      ward: ward || null,
      gender: gender || null,
      role: role || UserRoles.USER_ROLE_ENDUSER
    });

    return await newUser.save();

  };

  createUserByGoogle = async ({email, name, googleId}) => {

    const newUser = new UserModel({
      email,
      passwordHash: null,
      passwordSalt: null,
      type: UserTypes.TYPE_CUSTOMER,
      name,
      username: null,
      phone: null,
      tokenEmailConfirm: null,
      registerBy: RegisterByTypes.GOOGLE,
      status: Status.ACTIVE,
      address: null,
      city: null,
      district: null,
      ward: null,
      gender: null,
      role: UserRoles.USER_ROLE_ENDUSER,
      googleId
    });
    return await newUser.save();
  };

  generateToken = (data) => {
    const secretKey = General.jwtSecret;
    return jwt.sign(data, secretKey, {
      expiresIn: (60 * 60) * UserConstant.tokenExpiredInHour
    });
  };

  findByEmailOrUsername = async (email, username) => {
    return await UserModel.findOne({
      $or: [{email: email}, {username: username}]
    });
  };

  updateGoogleId = async (user, googleId) => {
    user.googleId = googleId;
    return await user.save();
  };

  findByEmail = async (email) => {
    return await UserModel.findOne({email: email});
  };

  findByGoogleId = async (googleId) => {
    return await UserModel.findOne({googleId: googleId});
  };


  isValidHashPassword = (hashed, plainText) => {
    try {
      return bcrypt.compareSync(plainText, hashed);
    } catch (e) {
      return false;
    }
  };

  getSellerInProductDetail = async (id) => {
    return await UserModel.findOne({_id: id}, this.sellerInProductDetailFields);
  }

}
