import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/init';

class Team extends Model {
  public id!: number;
  public teamNumber!: number;
  public autoScoreCoral!: boolean;
  public autoScoreAlgae!: boolean;
  public mustStartSpecificPosition!: boolean;
  public autoStartingPosition!: string | null;
  public teleopDealgifying!: boolean;
  public teleopPreference!: string | null;
  public scoringPreference!: string | null;
  public coralLevels!: string[];
  public endgameType!: string;
  public robotWidth!: number | null;
  public robotLength!: number | null;
  public robotHeight!: number | null;
  public robotWeight!: number | null;
  public drivetrainType!: string | null;
  public notes!: string;
  public imageUrl!: string | null;
}

Team.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  teamNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  autoScoreCoral: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  autoScoreAlgae: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  mustStartSpecificPosition: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  autoStartingPosition: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  teleopDealgifying: {
    type: DataTypes.BOOLEAN,
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
    defaultValue: [],
  },
  endgameType: {
    type: DataTypes.STRING,
    defaultValue: 'none',
  },
  robotWidth: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  robotLength: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  robotHeight: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  robotWeight: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  drivetrainType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    defaultValue: '',
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'Team',
  tableName: 'teams',
});

export default Team; 