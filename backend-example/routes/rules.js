const express = require('express');
const DetectionRule = require('../models/DetectionRule');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/rules
// @desc    Get all detection rules
// @access  Private
router.get('/', async (req, res) => {
  try {
    const {
      limit = 1000,
      sort = 'createdAt',
      order = 'desc',
      platform,
      status,
      tactic,
      severity
    } = req.query;

    // Build filter object
    const filter = {};
    if (platform && platform !== 'all') filter.platform = platform;
    if (status && status !== 'all') filter.status = status;
    if (tactic && tactic !== 'all') filter.tactic = tactic;
    if (severity && severity !== 'all') filter.severity = severity;

    // Build sort object
    const sortObj = {};
    const sortField = sort === 'created_date' ? 'createdAt' : 
                     sort === 'updated_date' ? 'updatedAt' : sort;
    sortObj[sortField] = order === 'desc' ? -1 : 1;

    const rules = await DetectionRule.find(filter)
      .sort(sortObj)
      .limit(parseInt(limit))
      .lean();

    // Transform for frontend compatibility
    const transformedRules = rules.map(rule => ({
      ...rule,
      id: rule._id,
      created_date: rule.createdAt,
      updated_date: rule.updatedAt
    }));

    res.json(transformedRules);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/rules/:id
// @desc    Get single detection rule
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const rule = await DetectionRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }

    // Transform for frontend compatibility
    const transformedRule = {
      ...rule.toObject(),
      id: rule._id,
      created_date: rule.createdAt,
      updated_date: rule.updatedAt
    };

    res.json(transformedRule);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/rules
// @desc    Create detection rule
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const ruleData = {
      ...req.body,
      created_by: req.user.id,
      updated_by: req.user.id
    };

    const rule = new DetectionRule(ruleData);
    await rule.save();

    // Transform for frontend compatibility
    const transformedRule = {
      ...rule.toObject(),
      id: rule._id,
      created_date: rule.createdAt,
      updated_date: rule.updatedAt
    };

    res.status(201).json(transformedRule);
  } catch (error) {
    console.error(error.message);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Rule ID already exists'
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

// @route   PUT /api/rules/:id
// @desc    Update detection rule
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updated_by: req.user.id
    };

    const rule = await DetectionRule.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }

    // Transform for frontend compatibility
    const transformedRule = {
      ...rule.toObject(),
      id: rule._id,
      created_date: rule.createdAt,
      updated_date: rule.updatedAt
    };

    res.json(transformedRule);
  } catch (error) {
    console.error(error.message);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Rule ID already exists'
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

// @route   DELETE /api/rules/:id
// @desc    Delete detection rule
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const rule = await DetectionRule.findByIdAndDelete(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }

    res.json({
      success: true,
      message: 'Rule deleted successfully'
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/rules/bulk
// @desc    Create multiple detection rules
// @access  Private
router.post('/bulk', auth, async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Items array is required'
      });
    }

    // Add user info to each rule
    const rulesData = items.map(item => ({
      ...item,
      created_by: req.user.id,
      updated_by: req.user.id
    }));

    const rules = await DetectionRule.insertMany(rulesData);

    // Transform for frontend compatibility
    const transformedRules = rules.map(rule => ({
      ...rule.toObject(),
      id: rule._id,
      created_date: rule.createdAt,
      updated_date: rule.updatedAt
    }));

    res.status(201).json({
      success: true,
      message: `${rules.length} rules created successfully`,
      data: transformedRules
    });
  } catch (error) {
    console.error(error.message);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'One or more rule IDs already exist'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router; 