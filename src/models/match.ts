import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

interface MatchAttributes {
  id: number;
  matchNumber: number;
  teamNumber: number;
  autoScoreCoral: boolean;
  autoScoreAlgae: boolean;
  autoStartingPosition: string | null;
  teleopDealgifying: boolean;
  teleopPreference: string | null;
  scoringPreference: string | null;
  coralLevels: string[];
  endgameType: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MatchCreationAttributes extends Optional<MatchAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Match extends Model<MatchAttributes, MatchCreationAttributes> implements MatchAttributes {
  public id!: number;
  public matchNumber!: number;
  public teamNumber!: number;
  public autoScoreCoral!: boolean;
  public autoScoreAlgae!: boolean;
  public autoStartingPosition!: string | null;
  public teleopDealgifying!: boolean;
  public teleopPreference!: string | null;
  public scoringPreference!: string | null;
  public coralLevels!: string[];
  public endgameType!: string;
  public notes!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static initialize(sequelize: Sequelize) {
    Match.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        matchNumber: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        teamNumber: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        autoScoreCoral: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        autoScoreAlgae: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        autoStartingPosition: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        teleopDealgifying: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        teleopPreference: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        scoringPreference: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        coralLevels: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: false,
          defaultValue: [],
        },
        endgameType: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: 'none',
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: false,
          defaultValue: '',
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
      },
      {
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
      }
    );
  }

  static async createTable() {
    try {
      await Match.sync();
      console.log('Matches table created successfully');
    } catch (error) {
      console.error('Error creating matches table:', error);
      throw error;
    }
  }
}

export default Match; 