import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptionsWithoutRequest } from 'passport-jwt';
import { supabase } from '../config/supabase';
import { JwtPayload } from '../types';

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('Missing JWT_SECRET environment variable');
}

const options: StrategyOptionsWithoutRequest = {
  jwtFromRequest: ExtractJwt.fromExtractors([
    ExtractJwt.fromAuthHeaderAsBearerToken(),
    ExtractJwt.fromUrlQueryParameter('token')
  ]),
  secretOrKey: jwtSecret,
};

passport.use(
  new JwtStrategy(options, async (payload: JwtPayload, done) => {
    try {
      // DEMO: trust the JWT payload directly (Supabase unreachable)
      return done(null, {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        tenantId: payload.tenantId,
      });
    } catch (err) {
      return done(err, false);
    }
  })
);

export default passport;
