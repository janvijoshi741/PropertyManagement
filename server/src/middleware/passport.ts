import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptionsWithoutRequest } from 'passport-jwt';
import { supabase } from '../config/supabase';
import { JwtPayload } from '../types';

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('Missing JWT_SECRET environment variable');
}

const options: StrategyOptionsWithoutRequest = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtSecret,
};

passport.use(
  new JwtStrategy(options, async (payload: JwtPayload, done) => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', payload.userId)
        .eq('is_active', true)
        .single();

      if (error || !user) {
        return done(null, false);
      }

      return done(null, {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
      });
    } catch (err) {
      return done(err, false);
    }
  })
);

export default passport;
