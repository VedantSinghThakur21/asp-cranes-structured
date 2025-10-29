/**
 * Module resolver for Vite to handle server-side modules in browser context
 */

export default function serverModuleResolver() {
  return {
    name: 'server-module-resolver',
    resolveId(source) {
      // Handle server-only modules
      const serverOnlyModules = ['pg-promise', 'pg', 'bcryptjs', 'jsonwebtoken'];

      if (serverOnlyModules.includes(source)) {
        // Return a virtual module
        return `virtual:${source}-browser`;
      }

      return null;
    },

    load(id) {
      if (id.startsWith('virtual:')) {
        const moduleName = id.replace('virtual:', '').replace('-browser', '');

        // Return browser-compatible stub/mock
        console.log(`Creating browser-compatible mock for ${moduleName}`);

        switch (moduleName) {
          case 'pg-promise':
            return `
              export default function() {
                console.warn('pg-promise is not supported in browser environment');
                return {
                  none: () => Promise.resolve(),
                  one: () => Promise.resolve({}),
                  oneOrNone: () => Promise.resolve(null),
                  many: () => Promise.resolve([]),
                  manyOrNone: () => Promise.resolve([]),
                  any: () => Promise.resolve([]),
                  result: () => Promise.resolve({ rows: [] }),
                  multi: () => Promise.resolve([]),
                  multiResult: () => Promise.resolve([{ rows: [] }]),
                  tx: (cb) => Promise.resolve(cb({})),
                  task: (cb) => Promise.resolve(cb({}))
                };
              };
            `;

          case 'pg':
            return `
              export default {
                Pool: class MockPool {
                  constructor() {
                    console.warn('pg.Pool is not supported in browser environment');
                  }
                  connect() { return Promise.resolve({ release: () => {} }); }
                  query() { return Promise.resolve({ rows: [] }); }
                  end() { return Promise.resolve(); }
                },
                Client: class MockClient {
                  constructor() {
                    console.warn('pg.Client is not supported in browser environment');
                  }
                  connect() { return Promise.resolve(); }
                  query() { return Promise.resolve({ rows: [] }); }
                  end() { return Promise.resolve(); }
                }
              };
              export const Pool = class MockPool {
                constructor() {
                  console.warn('pg.Pool is not supported in browser environment');
                }
                connect() { return Promise.resolve({ release: () => {} }); }
                query() { return Promise.resolve({ rows: [] }); }
                end() { return Promise.resolve(); }
              };
            `;

          case 'bcryptjs':
            return `
              export function hash(password) {
                console.warn('bcryptjs.hash is not available in browser');
                return Promise.resolve('mock-hash');
              }
              
              export function compare(password, hash) {
                console.warn('bcryptjs.compare is not available in browser');
                return Promise.resolve(false);
              }
              
              export default {
                hash,
                compare,
                genSaltSync: () => 'mock-salt',
                hashSync: () => 'mock-hash',
                compareSync: () => false
              };
            `;

          case 'jsonwebtoken':
            return `
              export function sign(payload, secret, options) {
                console.warn('jsonwebtoken.sign is not available in browser');
                // Return a fake token
                return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtb2NrIjoidG9rZW4ifQ.mock-signature';
              }
              
              export function verify(token, secret, options) {
                console.warn('jsonwebtoken.verify is not available in browser');
                return { mock: 'token' };
              }
              
              export function decode(token) {
                // This can actually be implemented in browser
                try {
                  const parts = token.split('.');
                  if (parts.length !== 3) throw new Error('Invalid JWT');
                  
                  // Base64 decode the payload part
                  const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
                  return payload;
                } catch(e) {
                  console.error('Error decoding token:', e);
                  return null;
                }
              }
              
              export default {
                sign,
                verify,
                decode
              };
            `;

          default:
            return `
              console.warn('${moduleName} is not supported in browser environment');
              export default {};
            `;
        }
      }

      return null;
    },
  };
}
