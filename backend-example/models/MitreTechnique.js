const mongoose = require('mongoose');

const MitreTechniqueSchema = new mongoose.Schema({
  technique_id: {
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
  tactic: {
    type: String,
    required: true,
    trim: true
  },
  platforms: [{
    type: String,
    trim: true
  }],
  data_sources: [{
    type: String,
    trim: true
  }],
  is_subtechnique: {
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