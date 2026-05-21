import { Request } from 'express';
import prisma from '../db';

interface LogActivityParams {
  req: Request;
  action: string;
  entity: string;
  entityId?: string;
  description: string;
  metadata?: object;
}

/**
 * Catat aktivitas pengguna ke tabel activity_logs.
 * Dipanggil setelah operasi sukses di controller.
 * Gagal secara diam-diam agar tidak mengganggu response utama.
 */
export async function logActivity({
  req,
  action,
  entity,
  entityId,
  description,
  metadata,
}: LogActivityParams): Promise<void> {
  try {
    const user = req.user;
    if (!user) return; // Tidak log jika tidak ada user (misal: endpoint publik)

    // Ambil IP address dari berbagai header proxy yang umum
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      undefined;

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action,
        entity,
        entityId: entityId ?? null,
        description,
        metadata: metadata ?? undefined,
        ipAddress: ip ?? null,
      },
    });
  } catch {
    // Jangan lempar error — logging gagal tidak boleh merusak flow utama
  }
}
