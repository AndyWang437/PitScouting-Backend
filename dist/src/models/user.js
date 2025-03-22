"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const sequelize_1 = require("sequelize");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class User extends sequelize_1.Model {
    static initialize(sequelize) {
        this.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            email: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    isEmail: true,
                },
            },
            password: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: false,
            },
            teamNumber: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
        }, {
            sequelize,
            tableName: 'users',
            hooks: {
                beforeSave: async (user) => {
                    if (user.changed('password')) {
                        // Use synchronous methods to avoid Promise issues
                        const salt = bcryptjs_1.default.genSaltSync(10);
                        user.password = bcryptjs_1.default.hashSync(user.password, salt);
                    }
                },
            },
        });
    }
    validatePassword(password) {
        return new Promise((resolve, reject) => {
            bcryptjs_1.default.compare(password, this.password, (err, success) => {
                if (err) {
                    return reject(err);
                }
                resolve(success);
            });
        });
    }
}
exports.User = User;
