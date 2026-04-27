import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  verifyToken,
  sendVerificationEmail,
  sendWelcomeEmail,
  type AuthUser 
} from './auth';
import { storage } from './storage';

const router = Router();

// Register new user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 1 })
], async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await storage.createUser({
      email,
      password: hashedPassword,
      name,
      isVerified: false
    });

    // Try to send verification email, but auto-verify if it fails
    const verificationResult = await sendVerificationEmail(email, name);
    if (!verificationResult.success) {
      console.warn('Failed to send verification email to:', email);
      console.log('⚠️ Auto-verifying user due to email failure');
      // Auto-verify user when email service is unavailable
      await storage.verifyUser(email);
      const updatedUser = await storage.getUserByEmail(email);
      if (updatedUser) {
        user.isVerified = updatedUser.isVerified;
      }
    }

    const token = generateToken({
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      isVerified: user.isVerified
    });

    const message = user.isVerified 
      ? 'Account created and verified successfully! You can now use the platform.'
      : 'Account created successfully! Please check your email to verify your account before logging in.';

    res.status(201).json({
      message,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout endpoint
router.post('/logout', (req: any, res: any) => {
  // Since we're using JWT tokens (stateless), we can't invalidate them server-side
  // The client should remove the token from localStorage
  res.json({ message: 'Logged out successfully' });
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken({
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      isVerified: user.isVerified
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Verify email
router.post('/verify-email', [
  body('token').exists()
], async (req: any, res: any) => {
  try {
    const { token } = req.body;
    
    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'verification') {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    // Update user verification status
    const user = await storage.getUserByEmail(decoded.email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.json({ message: 'Email already verified' });
    }

    await storage.updateUser(user.id, { isVerified: true });

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name);

    // Generate new token with updated verification status
    const newToken = generateToken({
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      isVerified: true
    });

    res.json({
      message: 'Email verified successfully',
      token: newToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: true
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current user
router.get('/user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const user = await storage.getUserById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      isVerified: user.isVerified
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout (client-side token removal, but we can track it server-side if needed)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

export default router;