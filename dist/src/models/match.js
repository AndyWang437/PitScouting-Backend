"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
class Match extends sequelize_1.Model {
    static initialize(sequelize) {
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
                type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
                allowNull: false,
                defaultValue: [],
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
