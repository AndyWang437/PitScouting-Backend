"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
class Match extends sequelize_1.Model {
    // Helper method to always get coralLevels as an array regardless of storage format
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
        const isSqlite = sequelize.getDialect() === 'sqlite';
        Match.init({
            id: {
                type: sequelize_1.DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            matchNumber: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
            teamNumber: {
                type: sequelize_1.DataTypes.INTEGER,
                allowNull: false,
            },
            autoScoreCoral: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            autoScoreAlgae: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            autoStartingPosition: {
                type: sequelize_1.DataTypes.STRING,
                allowNull: true,
            },
            teleopDealgifying: {
                type: sequelize_1.DataTypes.BOOLEAN,
                allowNull: false,
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
                            // Try to parse it as JSON first
                            JSON.parse(value);
                            this.setDataValue('coralLevels', value);
                        }
                        catch (e) {
                            // If it's not valid JSON, store it as a JSON string
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
                allowNull: false,
                defaultValue: 'none',
            },
            notes: {
                type: sequelize_1.DataTypes.TEXT,
                allowNull: false,
                defaultValue: '',
            },
            createdAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: false,
            },
        }, {
            sequelize,
            modelName: 'Match',
            tableName: 'matches',
            timestamps: true,
            indexes: [
                {
                    unique: true,
                    fields: ['matchNumber', 'teamNumber'],
                },
            ],
        });
    }
    static async createTable() {
        try {
            await Match.sync();
            console.log('Matches table created successfully');
        }
        catch (error) {
            console.error('Error creating matches table:', error);
            throw error;
        }
    }
}
exports.default = Match;
