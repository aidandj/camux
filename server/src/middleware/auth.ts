import { Request, Response, NextFunction } from 'express';
import { UserSession } from '../types';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const session = req.session as UserSession;
  
  if (!session.userId || !session.accessToken) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (session.tokenExpiry && session.tokenExpiry < Date.now()) {
    return res.status(401).json({ error: 'Token expired' });
  }
  
  next();
};