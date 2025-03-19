"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const https_1 = __importDefault(require("https"));
const router = express.Router();
// Function to fetch content from a URL
function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https_1.default : require('http');
        protocol.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve(data);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}
// Route to fix the frontend directly
router.get('/fix-frontend', async (req, res) => {
    try {
        const frontendUrl = req.query.url || 'https://1334pitscouting.vercel.app';
        const teamNumber = req.query.team || '1';
        console.log(`Fixing frontend at: ${frontendUrl} for team ${teamNumber}`);
        // Fetch the team details page
        const teamDetailsUrl = `${frontendUrl}/team/${teamNumber}`;
        const teamDetailsPage = await fetchUrl(teamDetailsUrl);
        // Fix 1: Add code to handle coralLevels as an array
        const coralLevelsFixScript = `
      <script>
        // Fix for coralLevels not being an array
        window.addEventListener('DOMContentLoaded', function() {
          // Find all scripts on the page
          const scripts = document.querySelectorAll('script');
          
          // Inject our fix into each script
          scripts.forEach(script => {
            if (script.textContent && script.textContent.includes('coralLevels')) {
              // Get the script content
              let content = script.textContent;
              
              // Replace direct usage of coralLevels.map with a safe version
              content = content.replace(/(\w+)\.coralLevels\.map\(/g, function(match, objName) {
                return "(Array.isArray(" + objName + ".coralLevels) ? " + objName + ".coralLevels : (typeof " + objName + ".coralLevels === 'string' ? JSON.parse(" + objName + ".coralLevels || '[]') : [])).map(";
              });
              
              // Replace image paths
              content = content.replace(/\\/api\\/storage\\/([^"'\\s]+)/g, '/uploads/$1');
              
              // Create a new script element with the fixed content
              const fixedScript = document.createElement('script');
              fixedScript.textContent = content;
              
              // Replace the original script with the fixed one
              script.parentNode.replaceChild(fixedScript, script);
            }
          });
          
          // Also fix any existing DOM elements with coralLevels
          setTimeout(function() {
            try {
              // Find elements that might contain team data
              const teamElements = document.querySelectorAll('[data-team-id], [data-team-number]');
              
              teamElements.forEach(element => {
                // Try to find team data in the element
                const teamData = element.__team || element.team || element.dataset.team;
                
                if (teamData && teamData.coralLevels) {
                  // Fix coralLevels if it's not an array
                  if (!Array.isArray(teamData.coralLevels)) {
                    if (typeof teamData.coralLevels === 'string') {
                      try {
                        teamData.coralLevels = JSON.parse(teamData.coralLevels);
                      } catch (e) {
                        console.error('Error parsing coralLevels:', e);
                        teamData.coralLevels = [];
                      }
                    } else {
                      teamData.coralLevels = [];
                    }
                  }
                }
              });
              
              console.log('PitScouting frontend fixes applied successfully!');
            } catch (error) {
              console.error('Error applying frontend fixes:', error);
            }
          }, 1000);
        });
      </script>
    `;
        // Fix 2: Add code to fix image paths
        const imagePathFixScript = `
      <script>
        // Fix for image paths
        window.addEventListener('DOMContentLoaded', function() {
          // Fix image paths in the DOM
          setTimeout(function() {
            try {
              // Find all images with /api/storage/ in the src
              const images = document.querySelectorAll('img[src^="/api/storage/"]');
              
              images.forEach(img => {
                // Replace /api/storage/ with /uploads/
                img.src = img.src.replace('/api/storage/', '/uploads/');
              });
              
              console.log('Image path fixes applied successfully!');
            } catch (error) {
              console.error('Error applying image path fixes:', error);
            }
          }, 500);
        });
      </script>
    `;
        // Inject the fix scripts into the page
        let fixedPage = teamDetailsPage;
        // Inject the fix scripts before the closing </body> tag
        fixedPage = fixedPage.replace('</body>', `${coralLevelsFixScript}${imagePathFixScript}</body>`);
        // Send the fixed page
        res.send(fixedPage);
    }
    catch (error) {
        console.error('Error fixing frontend:', error);
        res.status(500).json({ error: 'Error fixing frontend', details: error.message });
    }
});
// Route to provide a bookmarklet for fixing the frontend
router.get('/frontend-fix-bookmarklet', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>PitScouting Frontend Fix Bookmarklet</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .bookmarklet {
          display: inline-block;
          padding: 10px 15px;
          background-color: #4CAF50;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
        }
        pre {
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          overflow-x: auto;
        }
        .instructions {
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <h1>PitScouting Frontend Fix Bookmarklet</h1>
      
      <p>Drag this bookmarklet to your bookmarks bar:</p>
      
      <a class="bookmarklet" href="javascript:(function(){
        // Fix for coralLevels not being an array
        function fixCoralLevels() {
          try {
            // Find elements that might contain team data
            const teamElements = document.querySelectorAll('[data-team-id], [data-team-number]');
            
            teamElements.forEach(element => {
              // Try to find team data in the element
              const teamData = element.__team || element.team || element.dataset.team;
              
              if (teamData && teamData.coralLevels) {
                // Fix coralLevels if it's not an array
                if (!Array.isArray(teamData.coralLevels)) {
                  if (typeof teamData.coralLevels === 'string') {
                    try {
                      teamData.coralLevels = JSON.parse(teamData.coralLevels);
                    } catch (e) {
                      console.error('Error parsing coralLevels:', e);
                      teamData.coralLevels = [];
                    }
                  } else {
                    teamData.coralLevels = [];
                  }
                }
              }
            });
            
            console.log('coralLevels fix applied successfully!');
          } catch (error) {
            console.error('Error applying coralLevels fix:', error);
          }
        }
        
        // Fix for image paths
        function fixImagePaths() {
          try {
            // Find all images with /api/storage/ in the src
            const images = document.querySelectorAll('img[src^=\\\"/api/storage/\\\"]');
            
            images.forEach(img => {
              // Replace /api/storage/ with /uploads/
              img.src = img.src.replace('/api/storage/', '/uploads/');
            });
            
            console.log('Image path fixes applied successfully!');
          } catch (error) {
            console.error('Error applying image path fixes:', error);
          }
        }
        
        // Apply the fixes
        fixCoralLevels();
        fixImagePaths();
        
        // Also apply the fixes after a delay to catch dynamically loaded content
        setTimeout(function() {
          fixCoralLevels();
          fixImagePaths();
        }, 1000);
        
        alert('PitScouting frontend fixes applied!');
      })();">Fix PitScouting Frontend</a>
      
      <div class="instructions">
        <h2>Instructions:</h2>
        <ol>
          <li>Drag the "Fix PitScouting Frontend" button to your bookmarks bar</li>
          <li>Navigate to the team details page (e.g., https://1334pitscouting.vercel.app/team/1)</li>
          <li>Click the bookmarklet to apply the fixes</li>
          <li>The page should now display correctly</li>
        </ol>
      </div>
      
      <h2>Manual Fix Code</h2>
      <p>If the bookmarklet doesn't work, you can paste this code into your browser's console:</p>
      
      <pre>
// Fix for coralLevels not being an array
function fixCoralLevels() {
  try {
    // Find elements that might contain team data
    const teamElements = document.querySelectorAll('[data-team-id], [data-team-number]');
    
    teamElements.forEach(element => {
      // Try to find team data in the element
      const teamData = element.__team || element.team || element.dataset.team;
      
      if (teamData && teamData.coralLevels) {
        // Fix coralLevels if it's not an array
        if (!Array.isArray(teamData.coralLevels)) {
          if (typeof teamData.coralLevels === 'string') {
            try {
              teamData.coralLevels = JSON.parse(teamData.coralLevels);
            } catch (e) {
              console.error('Error parsing coralLevels:', e);
              teamData.coralLevels = [];
            }
          } else {
            teamData.coralLevels = [];
          }
        }
      }
    });
    
    console.log('coralLevels fix applied successfully!');
  } catch (error) {
    console.error('Error applying coralLevels fix:', error);
  }
}

// Fix for image paths
function fixImagePaths() {
  try {
    // Find all images with /api/storage/ in the src
    const images = document.querySelectorAll('img[src^="/api/storage/"]');
    
    images.forEach(img => {
      // Replace /api/storage/ with /uploads/
      img.src = img.src.replace('/api/storage/', '/uploads/');
    });
    
    console.log('Image path fixes applied successfully!');
  } catch (error) {
    console.error('Error applying image path fixes:', error);
  }
}

// Apply the fixes
fixCoralLevels();
fixImagePaths();

// Also apply the fixes after a delay to catch dynamically loaded content
setTimeout(function() {
  fixCoralLevels();
  fixImagePaths();
}, 1000);

alert('PitScouting frontend fixes applied!');
      </pre>
    </body>
    </html>
  `;
    res.send(html);
});
exports.default = router;
