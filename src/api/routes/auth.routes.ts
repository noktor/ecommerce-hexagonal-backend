import { Router } from 'express';
import type { TokenService } from '../../domain/services/TokenService';
import type { AuthController } from '../controllers/AuthController';
import { createAuthMiddleware } from '../middleware/auth';

export function createAuthRouter(controller: AuthController, tokenService: TokenService): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(tokenService);

  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: Register a new user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterRequest'
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Registration successful. Please check your email to verify your account.
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     email:
   *                       type: string
   *                     name:
   *                       type: string
   *       400:
   *         description: Bad request (missing fields, invalid email, etc.)
   *       500:
   *         description: Internal server error
   */
  router.post('/register', (req, res, next) => controller.register(req, res, next));

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Login user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginResponse'
   *       401:
   *         description: Invalid credentials or email not verified
   *       500:
   *         description: Internal server error
   */
  router.post('/login', (req, res, next) => controller.login(req, res, next));

  /**
   * @swagger
   * /api/auth/verify/{token}:
   *   get:
   *     summary: Verify user email
   *     tags: [Auth]
   *     parameters:
   *       - in: path
   *         name: token
   *         required: true
   *         schema:
   *           type: string
   *         description: Email verification token
   *     responses:
   *       200:
   *         description: Email verified successfully
   *       400:
   *         description: Invalid or expired token
   *       500:
   *         description: Internal server error
   */
  router.get('/verify/:token', (req, res, next) => controller.verifyEmail(req, res, next));

  /**
   * @swagger
   * /api/auth/forgot-password:
   *   post:
   *     summary: Request password reset
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ForgotPasswordRequest'
   *     responses:
   *       200:
   *         description: Password reset email sent (if email exists)
   *       500:
   *         description: Internal server error
   */
  router.post('/forgot-password', (req, res, next) => controller.forgotPassword(req, res, next));

  /**
   * @swagger
   * /api/auth/reset-password:
   *   post:
   *     summary: Reset password with token
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ResetPasswordRequest'
   *     responses:
   *       200:
   *         description: Password reset successfully
   *       400:
   *         description: Invalid token or password requirements not met
   *       500:
   *         description: Internal server error
   */
  router.post('/reset-password', (req, res, next) => controller.resetPassword(req, res, next));

  /**
   * @swagger
   * /api/auth/me:
   *   get:
   *     summary: Get current authenticated user
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Current user information
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Internal server error
   */
  router.get('/me', authMiddleware, (req, res, next) => controller.getCurrentUser(req, res, next));

  return router;
}
