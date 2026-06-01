import { Request, Response, NextFunction } from 'express';
import prisma from '../db';
import { logActivity } from '../lib/activityLog';

const DEFAULT_SCHOOL = {
  name: 'MI Bustanul Huda Dawuhan',
  npsn: '20512345',
  address: 'Jl. Contoh Alamat No. 123, Dawuhan, Jawa Timur',
  headmaster: 'H. Fulan, S.Pd.I',
  headmasterNip: '19700101 200003 1 001',
  city: null,
  signatureUrl: null,
  accreditation: 'A',
};

export const getSchoolProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let profile = await prisma.schoolProfile.findFirst();

    if (!profile) {
      // If none exists, create default one
      profile = await (prisma.schoolProfile.create as any)({
        data: DEFAULT_SCHOOL,
      });
    }

    // Ensure the logo URL is absolute so frontend can display it easily
    let responseProfile = { ...profile };
    const host = req.get('host');
    const protocol = req.protocol;
    
    if (responseProfile.logoUrl && !responseProfile.logoUrl.startsWith('http')) {
      responseProfile.logoUrl = `${protocol}://${host}${responseProfile.logoUrl}`;
    }
    if (responseProfile.signatureUrl && !responseProfile.signatureUrl.startsWith('http')) {
      responseProfile.signatureUrl = `${protocol}://${host}${responseProfile.signatureUrl}`;
    }

    return res.status(200).json(responseProfile);
  } catch (error) {
    next(error);
  }
};

export const updateSchoolProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, foundationName, npsn, nsm, address, district, province, headmaster, headmasterNip, city, sklNumberFormat, sknrNumberFormat, accreditation } = req.body;
    let profile = await prisma.schoolProfile.findFirst();

    let logoUrl = profile?.logoUrl;
    let signatureUrl = profile?.signatureUrl;
    
    // If new files are uploaded
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    if (files?.logo && files.logo.length > 0) {
      logoUrl = `/uploads/${files.logo[0].filename}`;
    } else if (req.body.deleteLogo === 'true') {
      logoUrl = null;
    }

    if (files?.signature && files.signature.length > 0) {
      signatureUrl = `/uploads/${files.signature[0].filename}`;
    } else if (req.body.deleteSignature === 'true') {
      signatureUrl = null;
    }

    if (profile) {
      profile = await (prisma.schoolProfile.update as any)({
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
          signatureUrl,
          sklNumberFormat: sklNumberFormat !== undefined ? (sklNumberFormat || null) : profile.sklNumberFormat,
          sknrNumberFormat: sknrNumberFormat !== undefined ? (sknrNumberFormat || null) : profile.sknrNumberFormat,
          accreditation: accreditation !== undefined ? (accreditation || 'A') : profile.accreditation,
        },
      });
    } else {
      profile = await (prisma.schoolProfile.create as any)({
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
          signatureUrl,
          sklNumberFormat: sklNumberFormat || null,
          sknrNumberFormat: sknrNumberFormat || null,
          accreditation: accreditation || 'A',
        },
      });
    }

    if (!profile) {
      return res.status(500).json({ message: 'Gagal memproses profil madrasah.' });
    }

    logActivity({ req, action: 'UPDATE_SCHOOL_PROFILE', entity: 'SchoolProfile', entityId: profile.id, description: `Memperbarui profil madrasah: ${profile.name}` });

    let responseProfile = { ...profile };
    const host = req.get('host');
    const protocol = req.protocol;
    
    if (responseProfile.logoUrl && !responseProfile.logoUrl.startsWith('http')) {
      responseProfile.logoUrl = `${protocol}://${host}${responseProfile.logoUrl}`;
    }
    if (responseProfile.signatureUrl && !responseProfile.signatureUrl.startsWith('http')) {
      responseProfile.signatureUrl = `${protocol}://${host}${responseProfile.signatureUrl}`;
    }

    return res.status(200).json({
      message: 'Profil Madrasah berhasil diperbarui.',
      data: responseProfile,
    });
  } catch (error) {
    next(error);
  }
};
