import { prisma } from '../../config/prisma.js';
import { hashValue, verifyValue } from '../../lib/bcrypt.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt.js';
import { ApiError } from '../../utils/ApiError.js';
import { Role, type Role as RoleType } from '@prisma/client';

const publicProfile = ({ passwordHash, refreshTokenHash, ...profile }: any) => profile;
const tokensFor = async (profile: { id: string; role: RoleType }) => { const refreshToken = signRefreshToken(profile.id, profile.role); await prisma.profile.update({ where: { id: profile.id }, data: { refreshTokenHash: await hashValue(refreshToken) } }); return { accessToken: signAccessToken(profile.id, profile.role), refreshToken }; };
export const authService = {
  async register(data: { fullName: string; email: string; password: string }) { const exists = await prisma.profile.findUnique({ where: { email: data.email.toLowerCase() } }); if (exists) throw new ApiError(409, 'EMAIL_TAKEN', 'An account with this email already exists'); const profile = await prisma.profile.create({ data: { fullName: data.fullName, email: data.email.toLowerCase(), role: Role.DRIVER, passwordHash: await hashValue(data.password) } }); return { user: publicProfile(profile), ...(await tokensFor(profile)) }; },
  async login(email: string, password: string) { const profile = await prisma.profile.findUnique({ where: { email: email.toLowerCase() } }); if (!profile || !(await verifyValue(password, profile.passwordHash))) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect'); return { user: publicProfile(profile), ...(await tokensFor(profile)) }; },
  async refresh(token: string) { let payload; try { payload = verifyRefreshToken(token); } catch { throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired'); } if (payload.type !== 'refresh') throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Invalid token type'); const profile = await prisma.profile.findUnique({ where: { id: payload.sub } }); if (!profile?.refreshTokenHash || !(await verifyValue(token, profile.refreshTokenHash))) throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token has been revoked'); return { user: publicProfile(profile), ...(await tokensFor(profile)) }; },
  async logout(id: string) { await prisma.profile.update({ where: { id }, data: { refreshTokenHash: null } }); },
  async me(id: string) { const profile = await prisma.profile.findUnique({ where: { id } }); if (!profile) throw new ApiError(404, 'USER_NOT_FOUND', 'User not found'); return publicProfile(profile); },
};
