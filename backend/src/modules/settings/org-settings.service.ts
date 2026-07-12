import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { updateOrgSettingsSchema } from './org-settings.validation.js';

const ORG_SETTINGS_ID = 1;

export const orgSettingsService = {
  async getOrgSettings() {
    const settings = await prisma.organizationSettings.findUnique({
      where: { id: ORG_SETTINGS_ID },
    });

    if (!settings) {
      return prisma.organizationSettings.create({
        data: {
          id: ORG_SETTINGS_ID,
          orgName: 'TransitOps',
          depotName: 'Main Depot',
          currency: 'LKR',
          distanceUnit: 'KM',
          timezone: 'Asia/Colombo',
        },
      });
    }

    return settings;
  },

  async updateOrgSettings(payload: unknown) {
    const data = updateOrgSettingsSchema.parse(payload);

    const existing = await prisma.organizationSettings.findUnique({
      where: { id: ORG_SETTINGS_ID },
    });

    if (!existing) {
      return prisma.organizationSettings.create({
        data: {
          id: ORG_SETTINGS_ID,
          orgName: data.orgName ?? 'TransitOps',
          depotName: data.depotName ?? 'Main Depot',
          currency: data.currency ?? 'LKR',
          distanceUnit: data.distanceUnit ?? 'KM',
          timezone: data.timezone ?? 'Asia/Colombo',
          contactEmail: data.contactEmail ?? null,
          contactPhone: data.contactPhone ?? null,
          address: data.address ?? null,
        },
      });
    }

    return prisma.organizationSettings.update({
      where: { id: ORG_SETTINGS_ID },
      data,
    });
  },
};
