"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = logActivity;
const db_1 = __importDefault(require("../db"));
/**
 * Catat aktivitas pengguna ke tabel activity_logs.
 * Dipanggil setelah operasi sukses di controller.
 * Gagal secara diam-diam agar tidak mengganggu response utama.
 */
async function logActivity({ req, action, entity, entityId, description, metadata, }) {
    try {
        const user = req.user;
        if (!user)
            return; // Tidak log jika tidak ada user (misal: endpoint publik)
        // Ambil IP address dari berbagai header proxy yang umum
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.socket?.remoteAddress ||
            undefined;
        await db_1.default.activityLog.create({
            data: {
                userId: user.id,
                userName: user.name,
                userRole: user.role,
                action,
                entity,
                entityId: entityId ?? null,
                description,
                metadata: metadata ? JSON.stringify(metadata) : null,
                ipAddress: ip ?? null,
            },
        });
    }
    catch {
        // Jangan lempar error — logging gagal tidak boleh merusak flow utama
    }
}
