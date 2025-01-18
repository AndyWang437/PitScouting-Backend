declare module 'dotenv' {
  export interface DotenvParseOutput {
    [key: string]: string;
  }

  export interface DotenvConfigOptions {
    path?: string;
    encoding?: string;
    debug?: boolean;
    override?: boolean;
  }

  export interface DotenvConfigOutput {
    parsed?: DotenvParseOutput;
    error?: Error;
  }

  export function config(options?: DotenvConfigOptions): DotenvConfigOutput;
  export function parse(src: string | Buffer): DotenvParseOutput;
}

declare module 'express-validator' {
  import { Request, Response, NextFunction } from 'express';

  export interface ValidationChain {
    exists(options?: { checkFalsy?: boolean; checkNull?: boolean }): ValidationChain;
    isLength(options: { min?: number; max?: number }): ValidationChain;
    isEmail(options?: any): ValidationChain;
    custom(validator: (value: any) => boolean | Promise<boolean>): ValidationChain;
    withMessage(message: string): ValidationChain;
    optional(options?: { nullable?: boolean; checkFalsy?: boolean }): ValidationChain;
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