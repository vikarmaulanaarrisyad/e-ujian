import { Request, Response } from 'express';
import { syncToMysql } from '../services/sync.service';

export const syncDatabase = async (req: Request, res: Response) => {
  try {
    const result = await syncToMysql();
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error during sync', error: error.message });
  }
};
