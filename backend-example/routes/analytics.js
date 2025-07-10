const express = require('express');
const DetectionRule = require('../models/DetectionRule');
const MitreTechnique = require('../models/MitreTechnique');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/analytics/stats
// @desc    Get overall statistics
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    // Get rule statistics
    const totalRules = await DetectionRule.countDocuments();
    const activeRules = await DetectionRule.countDocuments({ status: 'Active' });
    const testingRules = await DetectionRule.countDocuments({ status: 'Testing' });
    const inactiveRules = await DetectionRule.countDocuments({ status: 'Inactive' });

    // Get technique statistics
    const totalTechniques = await MitreTechnique.countDocuments();

    // Calculate coverage - only count technique IDs that exist in both collections
    const ruleTechniqueIds = await DetectionRule.distinct('technique_id', { status: 'Active' });
    console.log('📊 Rule technique IDs from active rules:', ruleTechniqueIds.length, ruleTechniqueIds.slice(0, 5));
    
    // Find which rule technique IDs actually exist in the MITRE techniques database
    const validCoveredTechniques = await MitreTechnique.find({ 
      technique_id: { $in: ruleTechniqueIds } 
    }).distinct('technique_id');
    console.log('📊 Valid covered techniques:', validCoveredTechniques.length, validCoveredTechniques.slice(0, 5));
    
    const coveragePercentage = totalTechniques > 0 
      ? Math.round((validCoveredTechniques.length / totalTechniques) * 100) 
      : 0;
    console.log('📊 Coverage calculation:', validCoveredTechniques.length, '/', totalTechniques, '=', coveragePercentage + '%');

    res.json({
      total_rules: totalRules,
      active_rules: activeRules,
      testing_rules: testingRules,
      inactive_rules: inactiveRules,
      coverage_percentage: coveragePercentage,
      total_techniques: totalTechniques
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