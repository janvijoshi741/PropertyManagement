import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { JwtPayload } from '../types';

declare global {
  namespace Express {
    interface User extends JwtPayload {}
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('jwt', { session: false }, (err: Error | null, user: JwtPayload | false) => {
    if (err || !user) {
      res.status(401).json({ error: 'Unauthorised' });
      return;
    }
    req.user = user;
    next();
  })(req, res, next);
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('jwt', { session: false }, (err: Error | null, user: JwtPayload | false) => {
    if (err || !user) {
      res.status(401).json({ error: 'Unauthorised' });
      return;
    }
    if (user.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden — admin access required' });
      return;
    }
    req.user = user;
    next();
  })(req, res, next);
};
