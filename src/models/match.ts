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
  coralLevels: string[] | string; 
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
  public coralLevels!: string[] | string; 
  public endgameType!: string;
  public notes!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

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

  static initialize(sequelize: Sequelize) {
    const isSqlite = sequelize.getDialect() === 'sqlite';
    
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