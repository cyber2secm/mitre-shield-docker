const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsDir);
}

// Configure multer for file uploads with preserved extensions
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename while preserving extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only CSV files and Excel files
    const allowedTypes = ['.csv', '.xlsx'];
    const extension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error('Only .csv and .xlsx files are allowed'), false);
    }
  }
});

// @route   POST /api/upload
// @desc    Upload file
// @access  Private
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Store original filename info for later use
    const fileInfo = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    };

    // Generate dynamic URL based on request
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    console.log('📤 File uploaded successfully:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      baseUrl: baseUrl
    });

    res.json({
      success: true,
      file_url: `${baseUrl}/uploads/${req.file.filename}`,
      filename: req.file.originalname,
      size: req.file.size,
      type: path.extname(req.file.originalname).toLowerCase()
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during file upload'
    });
  }
});

// @route   DELETE /api/upload/:filename
// @desc    Delete uploaded file (cleanup for failed imports)
// @access  Private
router.delete('/upload/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validate filename (security check)
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename'
      });
    }

    const filePath = path.join(__dirname, '../uploads', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Delete the file
    fs.unlinkSync(filePath);
    
    console.log('🗑️ Deleted upload file:', filename);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete file error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during file deletion'
    });
  }
});

// Helper function to parse CSV content
function parseCSV(content) {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));

    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }
  }

  return rows;
}

// @route   POST /api/extract-data
// @desc    Extract data from uploaded file
// @access  Private
router.post('/extract-data', async (req, res) => {
  try {
    const { file_url, json_schema } = req.body;

    if (!file_url) {
      return res.status(400).json({
        success: false,
        error: 'File URL is required'
      });
    }

    // Extract filename from the URL
    const filename = file_url.split('/').pop();
    const filePath = path.join(__dirname, '../uploads', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    try {
      // Read and parse the file
      const fileContent = fs.readFileSync(filePath, 'utf8');
      let parsedData;

      // Check file extension (now properly preserved)
      const fileExtension = path.extname(filename).toLowerCase();
      
      if (fileExtension === '.csv') {
        parsedData = parseCSV(fileContent);
      } else if (fileExtension === '.xlsx') {
        return res.status(400).json({
          success: false,
          error: 'Excel files (.xlsx) are not yet supported. Please convert to CSV format.'
        });
      } else {
        return res.status(400).json({
          success: false,
          error: 'Only CSV files are currently supported'
        });
      }

      // Validate required fields if schema is provided
      if (json_schema && json_schema.items && json_schema.items.required) {
        const requiredFields = json_schema.items.required;
        
        for (let i = 0; i < parsedData.length; i++) {
          const row = parsedData[i];
          for (const field of requiredFields) {
            if (!row[field] || row[field].trim() === '') {
              return res.status(400).json({
                success: false,
                error: `Row ${i + 2}: Missing required field '${field}'`
              });
            }
          }
        }
      }

      console.log(`✅ Successfully parsed CSV file: ${filename}`);
      console.log(`📊 Parsed ${parsedData.length} rows of data`);

      res.json({
        success: true,
        data: parsedData
      });

    } catch (parseError) {
      console.error('File parsing error:', parseError);
      res.status(400).json({
        success: false,
        error: `Failed to parse file: ${parseError.message}`
      });
    }

  } catch (error) {
    console.error('Extract data error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router; 