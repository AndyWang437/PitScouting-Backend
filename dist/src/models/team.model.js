"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTeamModel = void 0;
const sequelize_1 = require("sequelize");
const initTeamModel = (sequelize) => {
    console.log('Initializing Team model with sequelize instance');
    const Team = sequelize.define('Team', {
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
            allowNull: true,
        },
        autoScoreAlgae: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: true,
        },
        mustStartSpecificPosition: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: true,
        },
        autoStartingPosition: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
        },
        teleopDealgifying: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: true,
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
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
            get() {
                const value = this.getDataValue('coralLevels');
                if (!value)
                    return [];
                try {
                    if (typeof value === 'string') {
                        if (value.startsWith('{') && value.endsWith('}')) {
                            return value
                                .replace(/^\{|\}$/g, '') 
                                .split(',')
                                .map(item => item.trim().replace(/^"|"$/g, '')); 
                        }
                        return JSON.parse(value);
                    }
                    return value;
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
                else {
                    this.setDataValue('coralLevels', value);
                }
            }
        },
        endgameType: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
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
        imageUrl: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
        },
        notes: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: true,
        },
    }, {
        tableName: 'teams',
        timestamps: true,
    });
    Team.prototype.getCoralLevelsArray = function () {
        const coralLevels = this.getDataValue('coralLevels');
        if (!coralLevels)
            return [];
        if (typeof coralLevels === 'string') {
            try {
                if (coralLevels.startsWith('{') && coralLevels.endsWith('}')) {
                    const cleanedString = coralLevels
                        .replace(/^\{|\}$/g, '') 
                        .split(',')
                        .map(item => item.trim().replace(/^"|"$/g, '')); 
                    return cleanedString;
                }
                return JSON.parse(coralLevels);
            }
            catch (error) {
                console.error('Error parsing coralLevels:', error);
                return [];
            }
        }
        if (Array.isArray(coralLevels)) {
            return coralLevels;
        }
        return [coralLevels];
    };
    console.log('Team model initialized successfully');
    return Team;
};
exports.initTeamModel = initTeamModel;
