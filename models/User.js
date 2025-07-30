const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  age: {
    type: Number,
    min: 1,
    max: 120,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },
  height: {
    type: Number, // in cm
    min: 50,
    max: 300,
  },
  weight: {
    type: Number, // in kg
    min: 20,
    max: 500,
  },
  activityLevel: {
    type: String,
    enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'],
    default: 'moderately_active',
  },
  goals: [{
    type: String,
    enum: ['weight_loss', 'weight_gain', 'muscle_gain', 'maintain_weight', 'improve_fitness', 'improve_health'],
  }],
  dietaryRestrictions: [{
    type: String,
    enum: ['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'nut_free', 'halal', 'kosher'],
  }],
  bmiHistory: [{
    bmi: { type: Number, required: true },
    weight: { type: Number, required: true },
    date: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
});

// Calculate BMI virtual field
userSchema.virtual('currentBMI').get(function() {
  if (this.height && this.weight) {
    const heightInMeters = this.height / 100;
    return (this.weight / (heightInMeters * heightInMeters)).toFixed(1);
  }
  return null;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update BMI history when weight changes
userSchema.pre('save', function(next) {
  if (this.isModified('weight') && this.height && this.weight) {
    const heightInMeters = this.height / 100;
    const bmi = (this.weight / (heightInMeters * heightInMeters)).toFixed(1);
    
    this.bmiHistory.push({
      bmi: parseFloat(bmi),
      weight: this.weight,
      date: new Date(),
    });
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
