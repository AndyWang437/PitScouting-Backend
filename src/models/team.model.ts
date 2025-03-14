getCoralLevelsArray(): any[] {
  const coralLevels = this.getDataValue('coralLevels');
  
  if (!coralLevels) return [];
  
  if (typeof coralLevels === 'string') {
    try {
      // Handle PostgreSQL array format like "{\"level1\",\"level2\"}"
      if (coralLevels.startsWith('{') && coralLevels.endsWith('}')) {
        const cleanedString = coralLevels
          .replace(/^\{|\}$/g, '') // Remove { and }
          .split(',')
          .map(item => item.trim().replace(/^"|"$/g, '')); // Remove quotes
        
        return cleanedString;
      }
      
      // Try standard JSON parse
      return JSON.parse(coralLevels);
    } catch (error) {
      console.error('Error parsing coralLevels:', error);
      return [];
    }
  }
  
  // If it's already an array, return it
  if (Array.isArray(coralLevels)) {
    return coralLevels;
  }
  
  // If it's something else, wrap it in an array
  return [coralLevels];
} 