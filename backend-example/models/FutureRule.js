const mongoose = require('mongoose');

const FutureRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  technique_id: {
    type: String,
    required: true,
    trim: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['Windows', 'macOS', 'Linux', 'AWS', 'Azure', 'GCP', 'Oracle', 'Containers']
  },
  tactic: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    default: 'Medium'
  },
  rule_type: {
    type: String,
    required: true,
    enum: ['Product', 'SOC'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Planned', 'In Progress', 'Ready for Review'],
    default: 'Planned'
  },
  assigned_to: {
    type: String,
    trim: true,
    default: 'Unassigned'
  },
  target_date: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Create indexes
FutureRuleSchema.index({ technique_id: 1 });
FutureRuleSchema.index({ platform: 1 });
FutureRuleSchema.index({ status: 1 });
FutureRuleSchema.index({ priority: 1 });
FutureRuleSchema.index({ rule_type: 1 });
FutureRuleSchema.index({ assigned_to: 1 });

module.exports = mongoose.model('FutureRule', FutureRuleSchema); 