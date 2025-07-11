const mongoose = require('mongoose');

const DetectionRuleSchema = new mongoose.Schema({
  rule_id: {
    type: String,
    required: true,
    unique: true,
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
  technique_id: {
    type: String,
    required: true,
    trim: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['Windows', 'macOS', 'Linux', 'AWS', 'Azure', 'GCP', 'Oracle', 'Alibaba', 'Containers', 'Office Suite', 'Identity Provider', 'SaaS', 'IaaS']
  },
  tactic: {
    type: String,
    required: true,
    trim: true
  },
  rule_type: {
    type: String,
    required: true,
    enum: ['Product', 'SOC'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Testing', 'Inactive'],
    default: 'Testing'
  },
  xql_query: {
    type: String,
    required: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  severity: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    default: 'Medium'
  },
  false_positive_rate: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  assigned_user: {
    type: String,
    trim: true
  },
  creation_date: {
    type: Date
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
DetectionRuleSchema.index({ rule_id: 1 });
DetectionRuleSchema.index({ technique_id: 1 });
DetectionRuleSchema.index({ platform: 1 });
DetectionRuleSchema.index({ status: 1 });
DetectionRuleSchema.index({ tactic: 1 });
DetectionRuleSchema.index({ rule_type: 1 });

module.exports = mongoose.model('DetectionRule', DetectionRuleSchema); 