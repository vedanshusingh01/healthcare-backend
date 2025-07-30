const express = require('express');
const User = require('../models/User');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password; // Don't allow password updates through this route
    delete updates.email;    // Don't allow email updates through this route

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update BMI (weight/height change)
router.put('/bmi', authenticateToken, async (req, res) => {
  try {
    const { weight, height } = req.body;

    if (!weight || !height) {
      return res.status(400).json({ message: 'Weight and height are required' });
    }

    const user = await User.findById(req.user._id);
    user.weight = weight;
    user.height = height;
    
    await user.save();

    res.json({
      message: 'BMI updated successfully',
      currentBMI: user.currentBMI,
      bmiHistory: user.bmiHistory.slice(-10), // Return last 10 entries
    });
  } catch (error) {
    console.error('Update BMI error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get BMI history
router.get('/bmi-history', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('bmiHistory');
    res.json(user.bmiHistory.sort((a, b) => new Date(b.date) - new Date(a.date)));
  } catch (error) {
    console.error('Get BMI history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Calculate BMI
router.post('/calculate-bmi', (req, res) => {
  try {
    const { weight, height } = req.body;

    if (!weight || !height) {
      return res.status(400).json({ message: 'Weight and height are required' });
    }

    const heightInMeters = height / 100;
    const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);

    let category;
    if (bmi < 18.5) {
      category = 'Underweight';
    } else if (bmi < 25) {
      category = 'Normal weight';
    } else if (bmi < 30) {
      category = 'Overweight';
    } else {
      category = 'Obese';
    }

    res.json({
      bmi: parseFloat(bmi),
      category,
      weight,
      height,
    });
  } catch (error) {
    console.error('Calculate BMI error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
