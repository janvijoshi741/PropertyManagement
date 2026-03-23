import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';
import { validate } from '../middleware/validate';
import { requestOtpSchema, verifyOtpSchema, adminLoginSchema } from '../schemas/auth.schema';
import { AppError } from '../middleware/errorHandler';
import { JwtPayload } from '../types';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_EXPIRY = '7d';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

// POST /api/auth/request-otp
router.post('/request-otp', validate(requestOtpSchema), async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };

  // Check user exists (but always return generic message)
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .eq('role', 'customer')
    .eq('is_active', true)
    .single();

  if (user) {
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase.from('otp_codes').insert({
      email: email.toLowerCase(),
      code,
      expires_at: expiresAt,
    });

    // Log OTP to console (email delivery out of Phase 1 scope)
    console.log(`\n🔑 OTP for ${email}: ${code}\n`);
  }

  // Always return success (security: don't reveal if email exists)
  res.json({ data: { message: 'If your email is registered, you will receive an access code shortly.' } });
});

// POST /api/auth/verify-otp
router.post('/verify-otp', validate(verifyOtpSchema), async (req: Request, res: Response) => {
  const { email, code } = req.body as { email: string; code: string };

  const { data: otpRecord } = await supabase
    .from('otp_codes')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('code', code)
    .eq('used', false)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!otpRecord) {
    throw new AppError(401, 'Invalid or expired access code');
  }

  // Mark OTP as used
  await supabase.from('otp_codes').update({ used: true }).eq('id', otpRecord.id);

  // Get user
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('is_active', true)
    .single();

  if (!user) {
    throw new AppError(401, 'Invalid or expired access code');
  }

  const tokenPayload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenant_id,
  };

  const accessToken = signToken(tokenPayload);

  res.json({
    data: {
      accessToken,
      user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenant_id },
    },
  });
});

// POST /api/auth/admin/login
router.post('/admin/login', validate(adminLoginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('role', 'admin')
    .eq('is_active', true)
    .single();

  if (!user || !user.password_hash) {
    throw new AppError(401, 'Invalid email or password');
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new AppError(401, 'Invalid email or password');
  }

  const tokenPayload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenant_id,
  };

  const accessToken = signToken(tokenPayload);

  res.json({
    data: {
      accessToken,
      user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenant_id },
    },
  });
});

export default router;
