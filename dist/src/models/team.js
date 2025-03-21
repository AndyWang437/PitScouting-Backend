"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
class Team extends sequelize_1.Model {
    getCoralLevelsArray() {
        const levels = this.coralLevels;
        if (typeof levels === 'string') {
            try {
                return JSON.parse(levels);
            }
            catch (error) {
                console.error('Error parsing coralLevels string:', error);
                return [];
            }
        }
        return levels || [];
    }
    static initialize(sequelize) {
        console.log('Initializing Team model with sequelize instance');
        const isSqlite = sequelize.getDialect() === 'sqlite';
        this.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            teamNumber: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
                unique: true,
            },
            autoScoreCoral: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: false,
            },
            autoScoreAlgae: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: false,
            },
            mustStartSpecificPosition: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: false,
            },
            autoStartingPosition: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            teleopDealgifying: {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: false,
            },
            teleopPreference: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            scoringPreference: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            coralLevels: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: true,
                defaultValue: '[]',
                get() {
                    const rawValue = this.getDataValue('coralLevels');
                    if (!rawValue)
                        return [];
                    if (Array.isArray(rawValue))
                        return rawValue;
                    try {
                        return JSON.parse(rawValue);
                    }
                    catch (e) {
                        console.error('Error parsing coralLevels:', e);
                        return [];
                    }
                },
                set(value) {
                    if (Array.isArray(value)) {
                        this.setDataValue('coralLevels', JSON.stringify(value));
                    }
                    else if (typeof value === 'string') {
                        try {
                            JSON.parse(value);
                            this.setDataValue('coralLevels', value);
                        }
                        catch (e) {
                            this.setDataValue('coralLevels', JSON.stringify([value]));
                        }
                    }
                    else {
                        this.setDataValue('coralLevels', '[]');
                    }
                }
            },
            endgameType: {
                type: sequelize_1.DataTypes.STRING,
                defaultValue: 'none',
            },
            robotWidth: {
                type: sequelize_1.DataTypes.FLOAT,
                allowNull: true,
            },
            robotLength: {
                type: sequelize_1.DataTypes.FLOAT,
                allowNull: true,
            },
            robotHeight: {
                type: sequelize_1.DataTypes.FLOAT,
                allowNull: true,
            },
            robotWeight: {
                type: sequelize_1.DataTypes.FLOAT,
                allowNull: true,
            },
            drivetrainType: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            notes: {
                type: sequelize_1.DataTypes.TEXT,
                defaultValue: '',
                allowNull: true,
            },
            imageUrl: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            createdAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                defaultValue: sequelize_1.DataTypes.NOW,
            },
            updatedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
                defaultValue: sequelize_1.DataTypes.NOW,
            }
        }, {
            sequelize,
            modelName: 'Team',
            tableName: 'teams',
            timestamps: true
        });
        console.log('Team model initialized successfully');
    }
}
exports.default = Team;
