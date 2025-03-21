import express = require('express');
import path from 'path';
import fs from 'fs';

const router = express.Router();

const uploadsDir = process.env.NODE_ENV === 'production'
  ? '/opt/render/project/src/uploads'
  : path.join(__dirname, '../../uploads');

router.get('/api/storage/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  
  console.log(`Accessing image via /api/storage/ at: ${filePath}`);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    console.log(`Image not found: ${filePath}`);
    res.status(404).json({ error: 'Image not found' });
  }
});

router.get('/check-image/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  
  if (fs.existsSync(filePath)) {
    res.json({ 
      exists: true, 
      path: filePath,
      accessibleViaUploads: `/uploads/${filename}`,
      accessibleViaApiStorage: `/api/storage/${filename}`
    });
  } else {
    res.status(404).json({ 
      exists: false, 
      path: filePath,
      message: 'Image not found'
    });
  }
});

router.get('/test-image-paths', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Image Paths</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .image-test {
          margin-bottom: 20px;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 5px;
        }
        img {
          max-width: 300px;
          max-height: 300px;
          display: block;
          margin: 10px 0;
        }
        h2 {
          margin-top: 30px;
        }
        input {
          padding: 8px;
          width: 300px;
        }
        button {
          padding: 8px 16px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .error {
          color: red;
        }
        .success {
          color: green;
        }
      </style>
    </head>
    <body>
      <h1>Test Image Paths</h1>
      
      <div>
        <h2>Test Specific Image</h2>
        <input type="text" id="imageFilename" placeholder="Enter image filename (e.g., 1741974263519.png)" />
        <button onclick="testImage()">Test Image</button>
        
        <div id="testResult"></div>
      </div>
      
      <h2>Test Different Path Formats</h2>
      
      <div class="image-test">
        <h3>Format 1: /uploads/[filename]</h3>
        <div id="format1"></div>
      </div>
      
      <div class="image-test">
        <h3>Format 2: /api/storage/[filename]</h3>
        <div id="format2"></div>
      </div>
      
      <script>
        function testImage() {
          const filename = document.getElementById('imageFilename').value.trim();
          if (!filename) {
            document.getElementById('testResult').innerHTML = '<p class="error">Please enter a filename</p>';
            return;
          }
          
          fetch('/check-image/' + filename)
            .then(response => response.json())
            .then(data => {
              let html = '';
              if (data.exists) {
                html = '<p class="success">Image exists!</p>';
                html += '<p>Path: ' + data.path + '</p>';
                html += '<p>Accessible via: ' + data.accessibleViaUploads + '</p>';
                html += '<p>Also accessible via: ' + data.accessibleViaApiStorage + '</p>';
                html += '<h4>Test Image Display:</h4>';
                html += '<img src="/uploads/' + filename + '" alt="Test via /uploads/" />';
                html += '<img src="/api/storage/' + filename + '" alt="Test via /api/storage/" />';
              } else {
                html = '<p class="error">Image not found!</p>';
                html += '<p>Checked path: ' + data.path + '</p>';
              }
              document.getElementById('testResult').innerHTML = html;
              
              document.getElementById('format1').innerHTML = '<img src="/uploads/' + filename + '" alt="Test via /uploads/" onerror="this.onerror=null;this.src=\'\';this.alt=\'Image failed to load\';" />';
              document.getElementById('format2').innerHTML = '<img src="/api/storage/' + filename + '" alt="Test via /api/storage/" onerror="this.onerror=null;this.src=\'\';this.alt=\'Image failed to load\';" />';
            })
            .catch(error => {
              document.getElementById('testResult').innerHTML = '<p class="error">Error: ' + error.message + '</p>';
            });
        }
      </script>
    </body>
    </html>
  `;
  
  res.send(html);
});

export default router; 