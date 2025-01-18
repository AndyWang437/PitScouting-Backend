import { Request } from 'express';
import { Multer } from 'multer';

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
      files?: Express.Multer.File[];
    }
    interface Multer extends Multer {}
  }
} 