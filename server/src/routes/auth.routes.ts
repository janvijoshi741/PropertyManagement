import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase";
import { validate } from "../middleware/validate";
import {
  requestOtpSchema,
  verifyOtpSchema,
  adminLoginSchema,
} from "../schemas/auth.schema";
import { AppError } from "../middleware/errorHandler";
import { JwtPayload } from "../types";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";
const JWT_EXPIRY = "7d";

// ── Static OTP for demo (no Supabase otp_codes table needed) ──
const STATIC_OTP = "123456";
// In-memory store: email → { code, expiresAt }
const otpStore = new Map<string, { code: string; expiresAt: number }>();

function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

// POST /api/auth/request-otp
router.post(
  "/request-otp",
  validate(requestOtpSchema),
  async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };

    // Always store OTP — user existence is checked at verify time
    otpStore.set(email.toLowerCase(), {
      code: STATIC_OTP,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
    console.log(`\n🔑 OTP for ${email}: ${STATIC_OTP}\n`);

    res.json({
      data: {
        message:
          "If your email is registered, you will receive an access code shortly.",
      },
    });
  },
);

// POST /api/auth/verify-otp
router.post(
  "/verify-otp",
  validate(verifyOtpSchema),
  async (req: Request, res: Response) => {
    const { email, code } = req.body as { email: string; code: string };

    const stored = otpStore.get(email.toLowerCase());
    if (!stored || stored.code !== code || stored.expiresAt < Date.now()) {
      throw new AppError(401, "Invalid or expired access code");
    }
    otpStore.delete(email.toLowerCase());

    // Look up real user from Supabase
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, role, tenant_id")
      .eq("email", email.toLowerCase())
      .eq("is_active", true)
      .single();

    if (error || !user) {
      throw new AppError(401, "User not found or inactive");
    }

    if (user.role === 'master_admin') {
      throw new AppError(401, "Master admin must use password login");
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
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenant_id,
        },
      },
    });
  },
);

// POST /api/auth/admin/login
router.post(
  "/admin/login",
  validate(adminLoginSchema),
  async (req: Request, res: Response) => {
    const { email, password } = req.body as { email: string; password: string };

    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, role, tenant_id, password_hash")
      .eq("email", email.toLowerCase())
      .eq("role", "master_admin")
      .eq("is_active", true)
      .single();

    if (error || !user || !user.password_hash) {
      throw new AppError(401, "Invalid email or password");
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new AppError(401, "Invalid email or password");
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
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenant_id,
        },
      },
    });
  },
);

export default router;
