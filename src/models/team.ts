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
  public coralLevels!: string[] | string; // Allow string for SQLite storage
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
        type: isSqlite ? DataTypes.TEXT : DataTypes.ARRAY(DataTypes.STRING),
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