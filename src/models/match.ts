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
  coralLevels: string[] | string; // Allow string for SQLite storage
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
  public coralLevels!: string[] | string; // Allow string for SQLite storage
  public endgameType!: string;
  public notes!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Helper method to always get coralLevels as an array regardless of storage format
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
          type: isSqlite ? DataTypes.TEXT : DataTypes.ARRAY(DataTypes.STRING),
          allowNull: false,
          defaultValue: isSqlite ? '[]' : [],
          get() {
            const rawValue = this.getDataValue('coralLevels');
            if (!rawValue) return isSqlite ? '[]' : [];
            
            if (isSqlite) {
              // For SQLite, we return the raw string value
              // The getCoralLevelsArray() method can be used to get the parsed array
              return rawValue;
            }
            
            return rawValue;
          },
          set(value: any) {
            if (isSqlite) {
              if (typeof value === 'string') {
                // Store the string directly for SQLite
                this.setDataValue('coralLevels', value);
              } else if (Array.isArray(value)) {
                // Convert array to JSON string for SQLite
                this.setDataValue('coralLevels', JSON.stringify(value));
              } else {
                this.setDataValue('coralLevels', '[]');
              }
            } else {
              // PostgreSQL can handle arrays directly
              if (typeof value === 'string') {
                try {
                  // Parse string to array for PostgreSQL
                  const parsedValue = JSON.parse(value);
                  this.setDataValue('coralLevels', parsedValue);
                } catch (error) {
                  console.error('Error parsing coralLevels for PostgreSQL:', error);
                  this.setDataValue('coralLevels', []);
                }
              } else {
                this.setDataValue('coralLevels', value || []);
              }
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