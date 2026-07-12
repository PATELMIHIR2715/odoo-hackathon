import type { RequestHandler } from 'express';
import { authService } from './auth.service.js';
import { loginSchema, refreshSchema, registerSchema } from './auth.validation.js';
export const register: RequestHandler = async (req, res) => res.status(201).json({ data: await authService.register(registerSchema.parse(req.body)) });
export const login: RequestHandler = async (req, res) => { const { email, password } = loginSchema.parse(req.body); res.json({ data: await authService.login(email, password) }); };
export const refresh: RequestHandler = async (req, res) => { const { refreshToken } = refreshSchema.parse(req.body); const token = refreshToken ?? req.cookies?.refreshToken; if (!token) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Refresh token is required' } }); res.json({ data: await authService.refresh(token) }); };
export const logout: RequestHandler = async (req, res) => { await authService.logout(req.user!.id); res.status(204).end(); };
export const me: RequestHandler = async (req, res) => res.json({ data: await authService.me(req.user!.id) });
