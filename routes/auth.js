import express from 'express';
import bcryptjs from 'bcryptjs';
import User from '../models/User.js';
import { generateToken } from '../utils/authUtils.js';
import { sendVerificationEmail, sendWelcomeEmail } from '../services/emailService.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, role } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !phone || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Create user
    const newUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role,
      isVerified: false
    });

    await newUser.save();

    // Generate token
    const token = generateToken(newUser._id, role);

    // Send welcome email
    await sendWelcomeEmail(email, firstName, role);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isPasswordCorrect = await bcryptjs.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Current User
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    // Decode token and get user (implement proper JWT verification here)
    res.json({ success: true, message: 'User profile endpoint' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
