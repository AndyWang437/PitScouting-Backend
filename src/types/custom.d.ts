declare module 'dotenv' {
  export function config(options?: {
    path?: string;
    encoding?: string;
    debug?: boolean;
  }): { parsed?: { [key: string]: string } };
}

declare module 'express-validator' {
  export * from 'express-validator/src/middlewares/validation-chain-builders';
  export * from 'express-validator/src/middlewares/schema';
  export * from 'express-validator/src/middlewares/matched-data';
  export * from 'express-validator/src/middlewares/sanitization-chain-builders';
  export * from 'express-validator/src/validation-result';
} 