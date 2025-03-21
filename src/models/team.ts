import { Model, DataTypes, Sequelize } from 'sequelize';

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
  public coralLevels!: string[] | string; 
  public endgameType!: string;
  public robotWidth!: number | null;
  public robotLength!: number | null;
  public robotHeight!: number | null;
  public robotWeight!: number | null;
  public drivetrainType!: string | null;
  public notes!: string;
  public imageUrl!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  public getCoralLevelsArray(): string[] {
    const levels = this.coralLevels;
    if (typeof levels === 'string') {
      try {
        return JSON.parse(levels);
      } catch (error) {
        console.error('Error parsing coralLevels string:', error);
        return [];
      }
    }
    return levels || [];
  }

  public static initialize(sequelize: Sequelize) {
    console.log('Initializing Team model with sequelize instance');
    const isSqlite = sequelize.getDialect() === 'sqlite';
    
    this.init({
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
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '[]',
        get() {
          const rawValue = this.getDataValue('coralLevels');
          if (!rawValue) return [];
          if (Array.isArray(rawValue)) return rawValue;
          try {
            return JSON.parse(rawValue);
          } catch (e) {
            console.error('Error parsing coralLevels:', e);
            return [];
          }
        },
        set(value: string[] | string) {
          if (Array.isArray(value)) {
            this.setDataValue('coralLevels', JSON.stringify(value));
          } else if (typeof value === 'string') {
            try {
              JSON.parse(value);
              this.setDataValue('coralLevels', value);
            } catch (e) {
              this.setDataValue('coralLevels', JSON.stringify([value]));
            }
          } else {
            this.setDataValue('coralLevels', '[]');
          }
        }
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
        allowNull: true,
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
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

export default Team; 