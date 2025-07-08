const express = require('express');
const MitreTechnique = require('../models/MitreTechnique');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/techniques
// @desc    Get all MITRE techniques
// @access  Private
router.get('/', async (req, res) => {
  try {
    // Check if database is connected
    if (!global.DATABASE_CONNECTED) {
      // Return mock data when database is not available
      const { getMockData } = require('../config/database');
      const mockData = getMockData();
      
      return res.json({
        success: true,
        data: mockData.techniques,
        message: 'Limited data - database not available'
      });
    }

    const {
      limit = 10000,
      sort = 'createdAt',
      order = 'desc',
      tactic,
      platform
    } = req.query;

    // Build filter object
    const filter = {};
    if (tactic && tactic !== 'all') filter.tactic = tactic;
    
    // Use extraction_platform instead of platforms for consistent filtering
    if (platform && platform !== 'all') {
      // Map platform names to extraction_platform values
      const platformMapping = {
        'Windows': 'windows',
        'Linux': 'linux',
        'macOS': 'macos',
        'Cloud': 'cloud',
        'Network Devices': 'network_devices',
        'Containers': 'containers',
        'Office Suite': 'officesuite',
        'Identity Provider': 'identity_provider',
        'SaaS': 'saas',
        'IaaS': 'iaas',
        'AI': 'ai'
      };
      
      const extractionPlatform = platformMapping[platform];
      if (extractionPlatform) {
        filter.extraction_platform = extractionPlatform;
      } else {
        // Fallback to old behavior for unknown platforms
        filter.platforms = { $in: [platform] };
      }
    }

    // Build sort object
    const sortObj = {};
    const sortField = sort === 'created_date' ? 'createdAt' : 
                     sort === 'updated_date' ? 'updatedAt' : sort;
    sortObj[sortField] = order === 'desc' ? -1 : 1;

    const techniques = await MitreTechnique.find(filter)
      .sort(sortObj)
      .limit(parseInt(limit))
      .lean();

    // Transform for frontend compatibility
    const transformedTechniques = techniques.map(technique => ({
      ...technique,
      id: technique._id,
      created_date: technique.createdAt,
      updated_date: technique.updatedAt
    }));

    res.json(transformedTechniques);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/techniques
// @desc    Create MITRE technique
// @access  Private
router.post('/', async (req, res) => {
  try {
    const technique = new MitreTechnique(req.body);
    await technique.save();

    // Transform for frontend compatibility
    const transformedTechnique = {
      ...technique.toObject(),
      id: technique._id,
      created_date: technique.createdAt,
      updated_date: technique.updatedAt
    };

    res.status(201).json(transformedTechnique);
  } catch (error) {
    console.error(error.message);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Technique ID already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router; 