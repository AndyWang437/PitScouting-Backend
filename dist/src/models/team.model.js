"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const init_1 = require("../db/init");
class Team extends sequelize_1.Model {
}
Team.init({
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
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        defaultValue: [],
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
    },
    imageUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
}, {
    sequelize: init_1.sequelize,
    modelName: 'Team',
    tableName: 'teams',
});
exports.default = Team;
