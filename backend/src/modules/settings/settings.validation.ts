import { Role } from '@prisma/client';
import { z } from 'zod';
import { APP_MODULE_LIST } from '../../constants/modules.js';

export const moduleAccessSchema = z.array(z.enum(APP_MODULE_LIST)).default([]);

export const updateRbacSchema = z.object({
  role: z.nativeEnum(Role).optional(),
  moduleAccess: moduleAccessSchema.optional(),
});
