declare module 'bcryptjs' {
  /**
   * Synchronously generates a hash for the given string.
   * @param s The string to hash
   * @param salt The salt to use, or the number of rounds to generate a salt
   * @returns The hashed string
   */
  export function hashSync(s: string, salt: string | number): string;

  /**
   * Synchronously tests a string against a hash.
   * @param s The string to compare
   * @param hash The hash to test against
   * @returns true if matching, false otherwise
   */
  export function compareSync(s: string, hash: string): boolean;

  /**
   * Generates a salt synchronously.
   * @param rounds The number of rounds to use, defaults to 10
   * @returns The generated salt
   */
  export function genSaltSync(rounds?: number): string;

  /**
   * Generates a hash for the given string.
   * @param s The string to hash
   * @param salt The salt to use, or the number of rounds to generate a salt
   * @param callback A callback to receive the hash
   * @returns The callback receiving the error and the resulting hash
   */
  export function hash(
    s: string,
    salt: string | number,
    callback: (err: Error | null, hash: string) => void
  ): void;

  /**
   * Tests a string against a hash.
   * @param s The string to compare
   * @param hash The hash to test against
   * @param callback A callback to receive the result
   * @returns The callback receiving the error and the result
   */
  export function compare(
    s: string,
    hash: string,
    callback: (err: Error | null, success: boolean) => void
  ): void;

  /**
   * Generates a salt.
   * @param rounds The number of rounds to use, defaults to 10
   * @param callback A callback to receive the salt
   * @returns The callback receiving the error and the resulting salt
   */
  export function genSalt(
    rounds: number,
    callback: (err: Error | null, salt: string) => void
  ): void;
  export function genSalt(callback: (err: Error | null, salt: string) => void): void;
}
