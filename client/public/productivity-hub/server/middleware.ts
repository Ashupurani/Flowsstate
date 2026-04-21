import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './auth';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    isVerified: boolean;
  };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Authorization token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  req.user = {
    id: parseInt(decoded.id),
    email: decoded.email,
    name: decoded.name,
    isVerified: decoded.isVerified
  };

  next();
};

export const requireVerification = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isVerified) {
    return res.status(403).json({ 
      message: 'Email verification required. Please check your email and verify your account.' 
    });
  }
  next();
};