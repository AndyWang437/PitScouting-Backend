/// <reference types="jest" />

declare namespace jest {
  interface Matchers<R> {
    toBeValid(): R;
    toMatchSchema(schema: any): R;
  }
}

declare module '@jest/types' {
  interface Expect extends jest.Matchers<void> {}
  interface InverseAsymmetricMatchers extends jest.Matchers<void> {}
  interface AsymmetricMatchers extends jest.Matchers<void> {}
} 