/**
 * Node.js-specific configuration
 * DO NOT import this file in middleware or any Edge Runtime code
 * Only use in server-side code that runs in Node.js environment
 */

/**
 * Safe projectRoot getter for Node.js environment
 * Returns current working directory in Node.js, '/' as fallback
 */
export const projectRoot =
  typeof process !== 'undefined' && typeof process.cwd === 'function'
    ? process.cwd()
    : '/';


















