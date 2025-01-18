import * as express from 'express';
import { Multer } from 'multer';

declare global {
  namespace Express {
    interface Request {
      file?: Multer.File;
      files?: Multer.File[];
      user?: any;
    }
  }
}

export = express; 