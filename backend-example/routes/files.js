const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// @route   POST /api/upload
// @desc    Upload file
// @access  Private
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // In a real implementation, you'd upload to cloud storage
    // For now, just return a mock response
    res.json({
      success: true,
      file_url: `http://localhost:3000/uploads/${req.file.filename}`,
      filename: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/extract-data
// @desc    Extract data from uploaded file
// @access  Private
router.post('/extract-data', auth, async (req, res) => {
  try {
    const { file_url, json_schema } = req.body;

    // Placeholder implementation
    // In a real implementation, you'd parse the CSV/Excel file
    // For now, return mock data
    const mockData = [
      {
        rule_id: 'RULE-001',
        name: 'Sample Rule 1',
        technique_id: 'T1059',
        platform: 'Windows',
        tactic: 'Execution',
        xql_query: 'dataset = xdr_data | filter action_process_image_name = "powershell.exe"',
        status: 'Testing',
        severity: 'Medium'
      },
      {
        rule_id: 'RULE-002',
        name: 'Sample Rule 2',
        technique_id: 'T1105',
        platform: 'Windows',
        tactic: 'Command and Control',
        xql_query: 'dataset = xdr_data | filter action_network_creation_time != null',
        status: 'Active',
        severity: 'High'
      }
    ];

    res.json({
      success: true,
      data: mockData
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router; 