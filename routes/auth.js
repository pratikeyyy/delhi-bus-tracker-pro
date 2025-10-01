const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Register new user
router.post('/register',
  [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['passenger', 'driver', 'admin']).withMessage('Invalid role'),
    body('preferredLanguage').optional().isIn(['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu']).withMessage('Invalid language')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { name, email, phone, password, role, preferredLanguage } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { phone }]
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists with this email or phone'
        });
      }

      // Create new user
      const user = new User({
        name,
        email,
        phone,
        password,
        role: role || 'passenger',
        preferredLanguage: preferredLanguage || 'en'
      });

      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      logger.info(`New user registered: ${email}`, { userId: user._id, role: user.role });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            preferredLanguage: user.preferredLanguage
          },
          token
        }
      });

    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed'
      });
    }
  }
);

// Login user
router.post('/login',
  [
    body('identifier').notEmpty().withMessage('Email or phone is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { identifier, password } = req.body;

      // Find user by email or phone
      const user = await User.findOne({
        $or: [
          { email: identifier.toLowerCase() },
          { phone: identifier }
        ],
        isActive: true
      }).select('+password');

      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      logger.info(`User logged in: ${user.email}`, { userId: user._id });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            preferredLanguage: user.preferredLanguage,
            lastLogin: user.lastLogin
          },
          token
        }
      });

    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed'
      });
    }
  }
);

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    logger.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Update user profile
router.put('/profile',
  authenticateToken,
  [
    body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('preferredLanguage').optional().isIn(['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu']).withMessage('Invalid language')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { name, preferredLanguage } = req.body;
      const user = await User.findById(req.user.id);

      if (name) user.name = name;
      if (preferredLanguage) user.preferredLanguage = preferredLanguage;

      await user.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
      });

    } catch (error) {
      logger.error('Profile update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }
);

// Change password
router.put('/change-password',
  authenticateToken,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.id).select('+password');

      if (!(await user.comparePassword(currentPassword))) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      user.password = newPassword;
      await user.save();

      logger.info(`Password changed for user: ${user.email}`, { userId: user._id });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      logger.error('Password change error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password'
      });
    }
  }
);

// Register device token for push notifications
router.post('/device-token',
  authenticateToken,
  [
    body('token').notEmpty().withMessage('Device token is required'),
    body('platform').isIn(['android', 'ios', 'web']).withMessage('Valid platform is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { token, platform } = req.body;
      const user = await User.findById(req.user.id);

      // Remove existing token for same platform
      user.deviceTokens = user.deviceTokens.filter(dt => dt.platform !== platform);

      // Add new token
      user.deviceTokens.push({ token, platform });

      await user.save();

      res.json({
        success: true,
        message: 'Device token registered successfully'
      });

    } catch (error) {
      logger.error('Device token registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register device token'
      });
    }
  }
);

// Logout (remove device token)
router.post('/logout',
  authenticateToken,
  [
    body('platform').optional().isIn(['android', 'ios', 'web']).withMessage('Valid platform required')
  ],
  async (req, res) => {
    try {
      const { platform } = req.body;
      const user = await User.findById(req.user.id);

      if (platform) {
        user.deviceTokens = user.deviceTokens.filter(dt => dt.platform !== platform);
        await user.save();
      }

      logger.info(`User logged out: ${user.email}`, { userId: user._id, platform });

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }
);

module.exports = router;
