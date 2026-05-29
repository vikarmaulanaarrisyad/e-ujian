"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSchoolProfile = exports.getSchoolProfile = void 0;
const db_1 = __importDefault(require("../db"));
const activityLog_1 = require("../lib/activityLog");
const DEFAULT_SCHOOL = {
    name: 'MI Bustanul Huda Dawuhan',
    npsn: '20512345',
    address: 'Jl. Contoh Alamat No. 123, Dawuhan, Jawa Timur',
    headmaster: 'H. Fulan, S.Pd.I',
    headmasterNip: '19700101 200003 1 001',
    city: null,
};
const getSchoolProfile = async (req, res, next) => {
    try {
        let profile = await db_1.default.schoolProfile.findFirst();
        if (!profile) {
            // If none exists, create default one
            profile = await db_1.default.schoolProfile.create({
                data: DEFAULT_SCHOOL,
            });
        }
        // Ensure the logo URL is absolute so frontend can display it easily
        let responseProfile = { ...profile };
        if (responseProfile.logoUrl && !responseProfile.logoUrl.startsWith('http')) {
            const host = req.get('host');
            const protocol = req.protocol;
            responseProfile.logoUrl = `${protocol}://${host}${responseProfile.logoUrl}`;
        }
        return res.status(200).json(responseProfile);
    }
    catch (error) {
        next(error);
    }
};
exports.getSchoolProfile = getSchoolProfile;
const updateSchoolProfile = async (req, res, next) => {
    try {
        const { name, foundationName, npsn, nsm, address, district, province, headmaster, headmasterNip, city, sklNumberFormat, sknrNumberFormat } = req.body;
        let profile = await db_1.default.schoolProfile.findFirst();
        let logoUrl = profile?.logoUrl;
        // If a new file is uploaded
        if (req.file) {
            logoUrl = `/uploads/${req.file.filename}`;
        }
        if (profile) {
            profile = await db_1.default.schoolProfile.update({
                where: { id: profile.id },
                data: {
                    name: name || profile.name,
                    npsn: npsn || profile.npsn,
                    nsm: nsm !== undefined ? (nsm || null) : profile.nsm,
                    address: address || profile.address,
                    district: district || profile.district,
                    province: province || profile.province,
                    city: city || profile.city,
                    foundationName: foundationName !== undefined ? (foundationName || null) : profile.foundationName,
                    headmaster: headmaster || profile.headmaster,
                    headmasterNip: headmasterNip || profile.headmasterNip,
                    logoUrl,
                    sklNumberFormat: sklNumberFormat !== undefined ? (sklNumberFormat || null) : profile.sklNumberFormat,
                    sknrNumberFormat: sknrNumberFormat !== undefined ? (sknrNumberFormat || null) : profile.sknrNumberFormat,
                },
            });
        }
        else {
            profile = await db_1.default.schoolProfile.create({
                data: {
                    name: name || DEFAULT_SCHOOL.name,
                    npsn: npsn || DEFAULT_SCHOOL.npsn,
                    nsm: nsm || null,
                    address: address || DEFAULT_SCHOOL.address,
                    district: district || null,
                    province: province || null,
                    city: city || DEFAULT_SCHOOL.city,
                    foundationName: foundationName || null,
                    headmaster: headmaster || DEFAULT_SCHOOL.headmaster,
                    headmasterNip: headmasterNip || DEFAULT_SCHOOL.headmasterNip,
                    logoUrl,
                    sklNumberFormat: sklNumberFormat || null,
                    sknrNumberFormat: sknrNumberFormat || null,
                },
            });
        }
        if (!profile) {
            return res.status(500).json({ message: 'Gagal memproses profil madrasah.' });
        }
        (0, activityLog_1.logActivity)({ req, action: 'UPDATE_SCHOOL_PROFILE', entity: 'SchoolProfile', entityId: profile.id, description: `Memperbarui profil madrasah: ${profile.name}` });
        let responseProfile = { ...profile };
        if (responseProfile.logoUrl && !responseProfile.logoUrl.startsWith('http')) {
            const host = req.get('host');
            const protocol = req.protocol;
            responseProfile.logoUrl = `${protocol}://${host}${responseProfile.logoUrl}`;
        }
        return res.status(200).json({
            message: 'Profil Madrasah berhasil diperbarui.',
            data: responseProfile,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateSchoolProfile = updateSchoolProfile;
