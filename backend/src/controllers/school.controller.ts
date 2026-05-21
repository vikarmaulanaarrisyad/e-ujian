import { Request, Response, NextFunction } from 'express';
import prisma from '../db';

const DEFAULT_SCHOOL = {
  name: 'MI Bustanul Huda Dawuhan',
  npsn: '20512345',
  address: 'Jl. Contoh Alamat No. 123, Dawuhan, Jawa Timur',
  headmaster: 'H. Fulan, S.Pd.I',
  headmasterNip: '19700101 200003 1 001',
  city: null,
};

export const getSchoolProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let profile = await prisma.schoolProfile.findFirst();

    if (!profile) {
      // If none exists, create default one
      profile = await prisma.schoolProfile.create({
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
  } catch (error) {
    next(error);
  }
};

export const updateSchoolProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, npsn, nsm, address, district, province, headmaster, headmasterNip, city, sklNumberFormat } = req.body;
    let profile = await prisma.schoolProfile.findFirst();

    let logoUrl = profile?.logoUrl;
    
    // If a new file is uploaded
    if (req.file) {
      logoUrl = `/uploads/${req.file.filename}`;
    }

    if (profile) {
      profile = await prisma.schoolProfile.update({
        where: { id: profile.id },
        data: {
          name: name || profile.name,
          npsn: npsn || profile.npsn,
          nsm: nsm !== undefined ? (nsm || null) : profile.nsm,
          address: address || profile.address,
          district: district || profile.district,
          province: province || profile.province,
          city: city || profile.city,
          headmaster: headmaster || profile.headmaster,
          headmasterNip: headmasterNip || profile.headmasterNip,
          logoUrl,
          sklNumberFormat: sklNumberFormat !== undefined ? (sklNumberFormat || null) : profile.sklNumberFormat,
        },
      });
    } else {
      profile = await prisma.schoolProfile.create({
        data: {
          name: name || DEFAULT_SCHOOL.name,
          npsn: npsn || DEFAULT_SCHOOL.npsn,
          nsm: nsm || null,
          address: address || DEFAULT_SCHOOL.address,
          district: district || null,
          province: province || null,
          city: city || DEFAULT_SCHOOL.city,
          headmaster: headmaster || DEFAULT_SCHOOL.headmaster,
          headmasterNip: headmasterNip || DEFAULT_SCHOOL.headmasterNip,
          logoUrl,
          sklNumberFormat: sklNumberFormat || null,
        },
      });
    }

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
  } catch (error) {
    next(error);
  }
};
