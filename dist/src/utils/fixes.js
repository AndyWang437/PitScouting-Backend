"use strict";
// Utility functions for data transformations and fixes
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyFrontendFixes = exports.fixImagePath = exports.fixCoralLevels = exports.fixBooleanValues = exports.debugTeamData = void 0;
/**
 * Debug function to log team data properties for troubleshooting
 * @param teamData The team data object to debug
 * @param label Optional label for the console log
 */
const debugTeamData = (teamData, label = 'Team Data') => {
    if (!teamData) {
        console.log(`${label}: No team data provided`);
        return;
    }
    console.log(`${label}:`);
    console.log(`- Team Number: ${teamData.teamNumber}`);
    console.log(`- Team Name: ${teamData.name || 'N/A'}`);
    console.log(`- Auto Score Coral: ${teamData.autoScoreCoral}`);
    console.log(`- Auto Score Algae: ${teamData.autoScoreAlgae}`);
    console.log(`- Must Start Specific Position: ${teamData.mustStartSpecificPosition}`);
    console.log(`- Coral Levels: ${JSON.stringify(teamData.coralLevels)}`);
    if (typeof teamData.coralLevels === 'string') {
        try {
            const parsed = JSON.parse(teamData.coralLevels);
            console.log(`- Coral Levels (parsed): ${JSON.stringify(parsed)}`);
        }
        catch (e) {
            console.log(`- Coral Levels parsing error: ${e}`);
        }
    }
    console.log(`- Robot Dimensions: ${teamData.robotWidth}×${teamData.robotLength}×${teamData.robotHeight}`);
};
exports.debugTeamData = debugTeamData;
/**
 * Fixes boolean values in team data that might be strings
 * @param teamData The team data object to fix
 * @returns The fixed team data
 */
const fixBooleanValues = (teamData) => {
    if (!teamData)
        return teamData;
    const booleanFields = [
        'autoScoreCoral',
        'autoScoreAlgae',
        'mustStartSpecificPosition',
        'teleopDealgifying'
    ];
    const fixedTeam = { ...teamData };
    for (const field of booleanFields) {
        if (field in fixedTeam) {
            // Convert string '1', '0', 'true', 'false' to boolean
            if (fixedTeam[field] === '1' || fixedTeam[field] === 1 || fixedTeam[field] === 'true') {
                fixedTeam[field] = true;
            }
            else if (fixedTeam[field] === '0' || fixedTeam[field] === 0 || fixedTeam[field] === 'false') {
                fixedTeam[field] = false;
            }
        }
    }
    return fixedTeam;
};
exports.fixBooleanValues = fixBooleanValues;
/**
 * Ensures coral levels are properly formatted as an array
 * @param teamData The team data object to fix
 * @returns The fixed team data with coral levels as an array
 */
const fixCoralLevels = (teamData) => {
    if (!teamData)
        return teamData;
    const fixedTeam = { ...teamData };
    // Handle case where coralLevels is a string (JSON or comma-separated)
    if (typeof fixedTeam.coralLevels === 'string') {
        try {
            fixedTeam.coralLevels = JSON.parse(fixedTeam.coralLevels);
        }
        catch (e) {
            // If parsing fails, try comma-separated
            if (fixedTeam.coralLevels.includes(',')) {
                fixedTeam.coralLevels = fixedTeam.coralLevels.split(',').map(level => level.trim());
            }
            else {
                // Single value
                fixedTeam.coralLevels = [fixedTeam.coralLevels];
            }
        }
    }
    // Ensure it's an array
    if (!Array.isArray(fixedTeam.coralLevels)) {
        if (fixedTeam.coralLevels) {
            fixedTeam.coralLevels = [fixedTeam.coralLevels];
        }
        else {
            fixedTeam.coralLevels = [];
        }
    }
    return fixedTeam;
};
exports.fixCoralLevels = fixCoralLevels;
/**
 * Fixes image paths by ensuring they have the correct prefix
 * @param path The image path to fix
 * @returns The fixed image path
 */
const fixImagePath = (path) => {
    if (!path)
        return '';
    // If path already starts with http or https, return as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    // If path starts with /uploads, add the API URL prefix
    if (path.startsWith('/uploads/')) {
        const apiUrl = process.env.REACT_APP_API_URL || 'https://pit-scouting-backend.onrender.com';
        return `${apiUrl}${path}`;
    }
    // If path is just a filename, assume it's in the uploads directory
    if (!path.includes('/')) {
        const apiUrl = process.env.REACT_APP_API_URL || 'https://pit-scouting-backend.onrender.com';
        return `${apiUrl}/api/storage/${path}`;
    }
    return path;
};
exports.fixImagePath = fixImagePath;
/**
 * Applies fixes to coral levels and image paths in the DOM
 * For use in a browser environment
 */
const applyFrontendFixes = () => {
    if (typeof document === 'undefined')
        return;
    // Fix coral levels display
    document.querySelectorAll('[data-coral-levels]').forEach(element => {
        const coralLevelsStr = element.getAttribute('data-coral-levels');
        if (!coralLevelsStr)
            return;
        try {
            const coralLevels = JSON.parse(coralLevelsStr);
            if (Array.isArray(coralLevels)) {
                element.textContent = coralLevels.join(', ');
            }
        }
        catch (e) {
            console.error('Error parsing coral levels:', e);
        }
    });
    // Fix image paths
    document.querySelectorAll('[data-image-path]').forEach(element => {
        const path = element.getAttribute('data-image-path');
        if (!path)
            return;
        const fixedPath = (0, exports.fixImagePath)(path);
        if (element instanceof HTMLImageElement) {
            element.src = fixedPath;
        }
        else if (element instanceof HTMLElement) {
            element.style.backgroundImage = `url(${fixedPath})`;
        }
    });
};
exports.applyFrontendFixes = applyFrontendFixes;
