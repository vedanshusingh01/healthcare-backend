const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    enum: ['workout', 'meal', 'hydration', 'sleep', 'medication', 'other'],
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  },
  dueDate: {
    type: Date,
  },
  reminder: {
    type: Date,
  },
  recurring: {
    enabled: {
      type: Boolean,
      default: false,
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
    },
    daysOfWeek: [{
      type: Number, // 0-6, where 0 is Sunday
      min: 0,
      max: 6,
    }],
  },
  metrics: {
    duration: Number, // in minutes
    calories: Number,
    distance: Number, // in km
    sets: Number,
    reps: Number,
    weight: Number, // in kg
    waterAmount: Number, // in ml
    sleepHours: Number,
  },
}, {
  timestamps: true,
});

// Update completedAt when task is marked as completed
taskSchema.pre('save', function(next) {
  if (this.isModified('completed') && this.completed) {
    this.completedAt = new Date();
  } else if (this.isModified('completed') && !this.completed) {
    this.completedAt = null;
  }
  next();
});

// Index for efficient queries
taskSchema.index({ user: 1, createdAt: -1 });
taskSchema.index({ user: 1, completed: 1 });
taskSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Task', taskSchema);
