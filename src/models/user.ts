import { Model, DataTypes, Sequelize } from 'sequelize';
import bcrypt from 'bcryptjs';

export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password: string;
  teamNumber: number;
}

export type UserCreationAttributes = Omit<UserAttributes, 'id'>;

export class User extends Model<UserAttributes, UserCreationAttributes> {
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
  public teamNumber!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initialize(sequelize: Sequelize) {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
          },
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        teamNumber: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'users',
        hooks: {
          beforeSave: async (user: User) => {
            if (user.changed('password')) {
              // Use synchronous methods to avoid Promise issues
              const salt = bcrypt.genSaltSync(10);
              user.password = bcrypt.hashSync(user.password, salt);
            }
          },
        },
      }
    );
  }

  public validatePassword(password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, this.password, (err, success) => {
        if (err) {
          return reject(err);
        }
        resolve(success);
      });
    });
  }
} 