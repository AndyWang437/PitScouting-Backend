import '@types/jest';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValid(): R;
      toMatchSchema(schema: any): R;
    }
  }
} 