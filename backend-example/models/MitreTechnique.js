const mongoose = require('mongoose');

const MitreTechniqueSchema = new mongoose.Schema({
  technique_id: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  tactic: {
    type: String,
    required: true,
    trim: true
  },
  tactics: [{
    type: String,
    trim: true
  }],
  platforms: [{
    type: String,
    trim: true
  }],
  data_sources: [{
    type: String,
    trim: true
  }],
  detection: {
    type: String,
    trim: true
  },
  detection_rules: [{
    type: String,
    trim: true
  }],
  is_subtechnique: {
    type: Boolean,
    default: false
  },
  parent_technique: {
    type: String,
    trim: true
  },
  parent_technique_id: {
    type: String,
    trim: true
  },
  mitre_version: {
    type: String,
    default: '1.0'
  },
  stix_id: {
    type: String,
    trim: true
  },
  last_updated: {
    type: Date,
    default: Date.now
  },
  sync_source: {
    type: String,
    default: 'manual'
  },
  extraction_platform: {
    type: String,
    trim: true
  },
  // Enhanced metadata fields
  complexity: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  impact_level: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  detection_difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  ai_specific: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create indexes
MitreTechniqueSchema.index({ technique_id: 1 });
MitreTechniqueSchema.index({ tactic: 1 });
MitreTechniqueSchema.index({ platforms: 1 });

module.exports = mongoose.model('MitreTechnique', MitreTechniqueSchema); 