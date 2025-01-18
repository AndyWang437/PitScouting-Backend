declare module 'express-validator' {
  import { Request, Response, NextFunction, RequestHandler } from 'express';

  export interface ValidationChain extends RequestHandler {
    exists(options?: { checkFalsy?: boolean; checkNull?: boolean }): ValidationChain;
    isLength(options: { min?: number; max?: number }): ValidationChain;
    isEmail(options?: any): ValidationChain;
    isInt(options?: any): ValidationChain;
    notEmpty(options?: any): ValidationChain;
    trim(): ValidationChain;
    custom(validator: (value: any) => boolean | Promise<boolean>): ValidationChain;
    withMessage(message: string): ValidationChain;
    optional(options?: { nullable?: boolean; checkFalsy?: boolean }): ValidationChain;
    run(req: Request): Promise<any>;
  }

  export interface ValidationResult {
    isEmpty(): boolean;
    array(): ValidationError[];
    mapped(): Record<string, ValidationError>;
    throw(): void;
  }

  export interface ValidationError {
    msg: string;
    param: string;
    value: any;
    location: string;
  }

  export function body(field: string, message?: string): ValidationChain;
  export function check(field: string, message?: string): ValidationChain;
  export function param(field: string, message?: string): ValidationChain;
  export function query(field: string, message?: string): ValidationChain;
  export function validationResult(req: Request): ValidationResult;
} 