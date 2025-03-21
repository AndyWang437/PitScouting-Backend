import { DataTypes, Model, Sequelize } from 'sequelize';

interface TeamAttributes {
  id?: number;
  teamNumber: number;
  autoScoreCoral?: boolean;
  autoScoreAlgae?: boolean;
  mustStartSpecificPosition?: boolean;
  autoStartingPosition?: string;
  teleopDealgifying?: boolean;
  teleopPreference?: string;
  scoringPreference?: string;
  coralLevels?: string[] | string;
  endgameType?: string;
  robotWidth?: number;
  robotLength?: number;
  robotHeight?: number;
  robotWeight?: number;
  drivetrainType?: string;
  imageUrl?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TeamModel extends Model<TeamAttributes>, TeamAttributes {
  getCoralLevelsArray(): any[];
}

export const initTeamModel = (sequelize: Sequelize) => {
  console.log('Initializing Team model with sequelize instance');
  
  const Team = sequelize.define<TeamModel>('Team', {
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
      allowNull: true,
    },
    autoScoreAlgae: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    mustStartSpecificPosition: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    autoStartingPosition: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    teleopDealgifying: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
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
      type: DataTypes.STRING,
      allowNull: true,
      get() {
        const value = this.getDataValue('coralLevels');
        if (!value) return [];
        
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
        } catch (e) {
          console.error('Error parsing coralLevels:', e);
          return [];
        }
      },
      set(value: string[] | string) {
        if (Array.isArray(value)) {
          this.setDataValue('coralLevels', JSON.stringify(value));
        } else {
          this.setDataValue('coralLevels', value);
        }
      }
    },
    endgameType: {
      type: DataTypes.STRING,
      allowNull: true,
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
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'teams',
    timestamps: true,
  });

  (Team as any).prototype.getCoralLevelsArray = function() {
    const coralLevels = this.getDataValue('coralLevels');
    
    if (!coralLevels) return [];
    
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
      } catch (error) {
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