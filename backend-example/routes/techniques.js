const express = require('express');
const MitreTechnique = require('../models/MitreTechnique');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/techniques
// @desc    Get all MITRE techniques
// @access  Private
router.get('/', async (req, res) => {
  try {
    const {
      limit = 1000,
      sort = 'createdAt',
      order = 'desc',
      tactic,
      platform
    } = req.query;

    // Build filter object
    const filter = {};
    if (tactic && tactic !== 'all') filter.tactic = tactic;
    if (platform && platform !== 'all') filter.platforms = { $in: [platform] };

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