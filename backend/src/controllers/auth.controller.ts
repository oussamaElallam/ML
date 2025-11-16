import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { AuthRequest, AppError, User, SignupBody, LoginBody } from '../types';

export class AuthController {
  async signup(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password, name, specialty, clinicName, licenseNumber }: SignupBody = req.body;

      // Validate input
      if (!email || !password || !name) {
        throw new AppError('Email, password, and name are required', 400);
      }

      // Check if user already exists
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        throw new AppError('User with this email already exists', 409);
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const userId = uuidv4();
      const result = await query(
        `INSERT INTO users (id, email, password_hash, name, specialty, clinic_name, license_number, subscription_tier, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, email, name, specialty, clinic_name, license_number, subscription_tier, email_verified, created_at, updated_at`,
        [
          userId,
          email.toLowerCase(),
          passwordHash,
          name,
          specialty || null,
          clinicName || null,
          licenseNumber || null,
          'free_trial',
          false,
        ]
      );

      const user = result.rows[0];

      // Create initial subscription
      await query(
        `INSERT INTO subscriptions (user_id, status, current_period_start, current_period_end)
         VALUES ($1, $2, NOW(), NOW() + INTERVAL '14 days')`,
        [userId, 'trialing']
      );

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          subscriptionTier: user.subscription_tier,
        },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            specialty: user.specialty,
            clinicName: user.clinic_name,
            licenseNumber: user.license_number,
            subscriptionTier: user.subscription_tier,
            emailVerified: user.email_verified,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password }: LoginBody = req.body;

      // Validate input
      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }

      // Find user
      const result = await query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        throw new AppError('Invalid email or password', 401);
      }

      const user: User = result.rows[0];

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          subscriptionTier: user.subscription_tier,
        },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Get subscription
      const subscriptionResult = await query(
        'SELECT * FROM subscriptions WHERE user_id = $1',
        [user.id]
      );

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            specialty: user.specialty,
            clinicName: user.clinic_name,
            licenseNumber: user.license_number,
            subscriptionTier: user.subscription_tier,
            emailVerified: user.email_verified,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
          },
          token,
          subscription: subscriptionResult.rows[0] || null,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const result = await query(
        'SELECT id, email, name, specialty, clinic_name, license_number, subscription_tier, email_verified, created_at, updated_at FROM users WHERE id = $1',
        [req.user.id]
      );

      if (result.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      const user = result.rows[0];

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          specialty: user.specialty,
          clinicName: user.clinic_name,
          licenseNumber: user.license_number,
          subscriptionTier: user.subscription_tier,
          emailVerified: user.email_verified,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated', 401);
      }

      const { name, specialty, clinicName, licenseNumber } = req.body;

      const result = await query(
        `UPDATE users
         SET name = COALESCE($1, name),
             specialty = COALESCE($2, specialty),
             clinic_name = COALESCE($3, clinic_name),
             license_number = COALESCE($4, license_number),
             updated_at = NOW()
         WHERE id = $5
         RETURNING id, email, name, specialty, clinic_name, license_number, subscription_tier, email_verified, created_at, updated_at`,
        [name, specialty, clinicName, licenseNumber, req.user.id]
      );

      const user = result.rows[0];

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          specialty: user.specialty,
          clinicName: user.clinic_name,
          licenseNumber: user.license_number,
          subscriptionTier: user.subscription_tier,
          emailVerified: user.email_verified,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // In a JWT-based system, logout is handled client-side
      // Here you could add token to a blacklist if needed
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
