const express = require('express');
const FutureRule = require('../models/FutureRule');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/future-rules
// @desc    Get all future rules
// @access  Private
router.get('/', async (req, res) => {
  try {
    const {
      limit = 1000,
      sort = 'createdAt',
      order = 'desc',
      platform,
      status,
      priority,
      assigned_to
    } = req.query;

    // Build filter object
    const filter = {};
    if (platform && platform !== 'all') filter.platform = platform;
    if (status && status !== 'all') filter.status = status;
    if (priority && priority !== 'all') filter.priority = priority;
    if (assigned_to && assigned_to !== 'all') filter.assigned_to = assigned_to;

    // Build sort object
    const sortObj = {};
    const sortField = sort === 'created_date' ? 'createdAt' : 
                     sort === 'updated_date' ? 'updatedAt' : sort;
    sortObj[sortField] = order === 'desc' ? -1 : 1;

    const futureRules = await FutureRule.find(filter)
      .sort(sortObj)
      .limit(parseInt(limit))
      .lean();

    // Transform for frontend compatibility
    const transformedRules = futureRules.map(rule => ({
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

// @route   GET /api/future-rules/:id
// @desc    Get single future rule
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const futureRule = await FutureRule.findById(req.params.id);

    if (!futureRule) {
      return res.status(404).json({
        success: false,
        error: 'Future rule not found'
      });
    }

    // Transform for frontend compatibility
    const transformedRule = {
      ...futureRule.toObject(),
      id: futureRule._id,
      created_date: futureRule.createdAt,
      updated_date: futureRule.updatedAt
    };

    res.json(transformedRule);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Future rule not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/future-rules
// @desc    Create future rule
// @access  Private
router.post('/', async (req, res) => {
  try {
    const ruleData = {
      ...req.body,
      // created_by: req.user.id,
      // updated_by: req.user.id
    };

    const futureRule = new FutureRule(ruleData);
    await futureRule.save();

    // Transform for frontend compatibility
    const transformedRule = {
      ...futureRule.toObject(),
      id: futureRule._id,
      created_date: futureRule.createdAt,
      updated_date: futureRule.updatedAt
    };

    res.status(201).json(transformedRule);
  } catch (error) {
    console.error(error.message);
    
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

// @route   PUT /api/future-rules/:id
// @desc    Update future rule
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      // updated_by: req.user.id
    };

    const futureRule = await FutureRule.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!futureRule) {
      return res.status(404).json({
        success: false,
        error: 'Future rule not found'
      });
    }

    // Transform for frontend compatibility
    const transformedRule = {
      ...futureRule.toObject(),
      id: futureRule._id,
      created_date: futureRule.createdAt,
      updated_date: futureRule.updatedAt
    };

    res.json(transformedRule);
  } catch (error) {
    console.error(error.message);
    
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

// @route   DELETE /api/future-rules/:id
// @desc    Delete future rule
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const futureRule = await FutureRule.findByIdAndDelete(req.params.id);

    if (!futureRule) {
      return res.status(404).json({
        success: false,
        error: 'Future rule not found'
      });
    }

    res.json({
      success: true,
      message: 'Future rule deleted successfully'
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/future-rules/:id/promote
// @desc    Promote future rule to detection rule
// @access  Private
router.post('/:id/promote', async (req, res) => {
  try {
    const futureRule = await FutureRule.findById(req.params.id);

    if (!futureRule) {
      return res.status(404).json({
        success: false,
        error: 'Future rule not found'
      });
    }

    // This endpoint will be used later when promoting to detection rules
    // For now, just return success
    res.json({
      success: true,
      message: 'Future rule promotion endpoint ready',
      futureRule: {
        ...futureRule.toObject(),
        id: futureRule._id,
        created_date: futureRule.createdAt,
        updated_date: futureRule.updatedAt
      }
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