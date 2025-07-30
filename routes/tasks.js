const express = require('express');
const Task = require('../models/Task');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get all tasks for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { completed, category, page = 1, limit = 10 } = req.query;
    
    const filter = { user: req.user._id };
    
    if (completed !== undefined) {
      filter.completed = completed === 'true';
    }
    
    if (category && category !== 'all') {
      filter.category = category;
    }

    const tasks = await Task.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Task.countDocuments(filter);

    res.json({
      tasks,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new task
router.post('/', authenticateToken, async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      user: req.user._id,
    };

    const task = new Task(taskData);
    await task.save();

    res.status(201).json({
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get single task
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({
      message: 'Task updated successfully',
      task,
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark task as completed/uncompleted
router.patch('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.completed = !task.completed;
    await task.save();

    res.json({
      message: `Task marked as ${task.completed ? 'completed' : 'pending'}`,
      task,
    });
  } catch (error) {
    console.error('Toggle task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get task statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalTasks,
      completedTasks,
      todayTasks,
      todayCompletedTasks,
      tasksByCategory
    ] = await Promise.all([
      Task.countDocuments({ user: userId }),
      Task.countDocuments({ user: userId, completed: true }),
      Task.countDocuments({ 
        user: userId, 
        createdAt: { $gte: today, $lt: tomorrow }
      }),
      Task.countDocuments({ 
        user: userId, 
        completed: true,
        completedAt: { $gte: today, $lt: tomorrow }
      }),
      Task.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      todayTasks,
      todayCompletedTasks,
      completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0,
      tasksByCategory: tasksByCategory.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
