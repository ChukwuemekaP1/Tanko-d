import { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, phone, role, documentId } = req.body;

      // Validate required fields
      if (!email || !password || !name || !role || !documentId) {
        res.status(400).json({ error: 'Missing mandatory fields (email, password, name, role, documentId).' });
        return;
      }

      if (role !== 'MANAGER' && role !== 'DRIVER') {
        res.status(400).json({ error: 'Invalid role. Must be MANAGER or DRIVER.' });
        return;
      }

      const user = await authService.register({
        name,
        email,
        password,
        phone,
        role,
        documentId,
      });

      res.status(201).json({
        message: 'Registration successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('[Auth] Registration error:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Failed to register',
      });
    }
  }
}

export const authController = new AuthController();
