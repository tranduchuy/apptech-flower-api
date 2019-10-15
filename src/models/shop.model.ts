import { Model, DataTypes } from 'sequelize';
import { MYSQL_CONNECTION } from '../utils/secrets';

export class Shop extends Model {
  id!: number;
  name: string;
  slug!: string;
  status: number;
  availableShipCountry: boolean;
  createdAt: Date;
  updatedAt: Date;
  discountRate: number;
}

Shop.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    field: 'ID',
    primaryKey: true,
    unique: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    field: 'NAME'
  },
  slug: {
    type: DataTypes.STRING(255),
    field: 'SLUG',
    unique: true
  },
  status: {
    type: DataTypes.NUMBER,
    field: 'STATUS',
  },
  availableShipCountry: {
    type: DataTypes.TINYINT,
    field: 'AVAILABLE_SHIP_COUNTRY'
  },
  createdAt: {
    field: 'CREATED_AT',
    type: DataTypes.DATE
  },
  updatedAt: {
    field: 'UPDATED_AT',
    type: DataTypes.DATE
  },
  discountRate: {
    field: 'DISCOUNT_RATE',
    type: DataTypes.FLOAT
  }
}, {
  tableName: 'SHOPS',
  freezeTableName: true,
  sequelize: MYSQL_CONNECTION,
  timestamps: false,
  modelName: 'shop'
});

export default Shop;
