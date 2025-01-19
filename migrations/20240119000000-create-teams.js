'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('teams', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      teamNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true
      },
      autoScoreCoral: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      autoScoreAlgae: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      mustStartSpecificPosition: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      autoStartingPosition: {
        type: Sequelize.STRING,
        allowNull: true
      },
      teleopDealgifying: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      teleopPreference: {
        type: Sequelize.STRING,
        allowNull: true
      },
      scoringPreference: {
        type: Sequelize.STRING,
        allowNull: true
      },
      coralLevels: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      endgameType: {
        type: Sequelize.STRING,
        defaultValue: 'none'
      },
      robotWidth: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      robotLength: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      robotHeight: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      robotWeight: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      drivetrainType: {
        type: Sequelize.STRING,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        defaultValue: ''
      },
      imageUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('teams');
  }
}; 