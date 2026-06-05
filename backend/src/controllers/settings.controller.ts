import { Request, Response } from 'express';
import prisma from '../config/database';
import { z } from 'zod';
import crypto from 'crypto';

// ─── VALIDATION SCHEMAS ───────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  // Email update is currently disabled for security, but keeping it in schema
});

const updateCompanySchema = z.object({
  name: z.string().min(2).max(100),
  industry: z.enum([
    'MANUFACTURING', 'TECHNOLOGY', 'FINANCE', 'HEALTHCARE', 
    'RETAIL', 'LOGISTICS', 'ENERGY', 'AGRICULTURE', 
    'CONSTRUCTION', 'OTHER'
  ]),
  totalEmployees: z.number().int().min(1),
  registrationNumber: z.string().min(1).optional(),
});

const generateApiKeySchema = z.object({
  name: z.string().min(1).max(100).default('Default Key'),
});

// ─── PROFILE HANDLERS ─────────────────────────────────────────────────────────

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('[Settings] getProfile Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const data = updateProfileSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: data.name },
      select: { id: true, name: true, email: true, role: true },
    });

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    console.error('[Settings] updateProfile Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ─── COMPANY HANDLERS ─────────────────────────────────────────────────────────

export const getCompany = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });

    return res.status(200).json({ success: true, data: company });
  } catch (error) {
    console.error('[Settings] getCompany Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const updateCompany = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId || !req.user?.sub) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const data = updateCompanySchema.parse(req.body);

    const company = await prisma.company.update({
      where: { id: companyId },
      data: {
        name: data.name,
        industry: data.industry,
        totalEmployees: data.totalEmployees,
        registrationNumber: data.registrationNumber,
      },
    });

    // Log the change
    await prisma.auditLog.create({
      data: {
        companyId,
        userId: req.user.sub,
        action: 'COMPANY_UPDATED',
        entityType: 'Company',
        entityId: companyId,
        metadata: { changes: data },
      }
    });

    return res.status(200).json({ success: true, data: company });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    console.error('[Settings] updateCompany Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ─── ENTERPRISE: API KEYS ─────────────────────────────────────────────────────

export const getApiKeys = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const apiKeys = await prisma.apiKey.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      // Only return a masked version of the key after creation
      select: {
        id: true,
        name: true,
        createdAt: true,
        lastUsed: true,
      }
    });

    return res.status(200).json({ success: true, data: apiKeys });
  } catch (error) {
    console.error('[Settings] getApiKeys Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const generateApiKey = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId || !req.user?.sub) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const data = generateApiKeySchema.parse(req.body);

    // Generate secure API Key (e.g. ct_test_1234567890abcdef)
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const newKey = `ct_live_${randomBytes}`;

    const apiKeyRecord = await prisma.apiKey.create({
      data: {
        name: data.name,
        key: newKey,
        companyId,
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        companyId,
        userId: req.user.sub,
        action: 'API_KEY_GENERATED',
        entityType: 'ApiKey',
        entityId: apiKeyRecord.id,
      }
    });

    // Return the actual key ONLY ONCE.
    return res.status(201).json({ 
      success: true, 
      data: {
        ...apiKeyRecord,
        key: newKey // User must copy this now
      } 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    console.error('[Settings] generateApiKey Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const revokeApiKey = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const { keyId } = req.params;
    if (!companyId || !req.user?.sub) return res.status(401).json({ success: false, error: 'Unauthorized' });

    await prisma.apiKey.delete({
      where: { id: keyId, companyId },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        companyId,
        userId: req.user.sub,
        action: 'API_KEY_REVOKED',
        entityType: 'ApiKey',
        entityId: keyId,
      }
    });

    return res.status(200).json({ success: true, message: 'API Key revoked successfully' });
  } catch (error) {
    console.error('[Settings] revokeApiKey Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ─── ENTERPRISE: AUDIT LOGS ───────────────────────────────────────────────────

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const logs = await prisma.auditLog.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error('[Settings] getAuditLogs Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
