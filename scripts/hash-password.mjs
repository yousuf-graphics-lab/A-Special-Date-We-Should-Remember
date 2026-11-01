#!/usr/bin/env node
/**
 * Generates the admin password hash.
 *
 *   npm run hash-password -- "your long password"
 *
 * Prints two forms:
 *   • ADMIN_PASSWORD_BASE64 — recommended, immune to .env `$` expansion
 *   • ADMIN_PASSWORD_HASH   — with every `$` escaped, for .env files
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');

const password = process.argv.slice(2).join(' ');

if (!password) {
  console.error('Usage: npm run hash-password -- "YourSecretPassword"');
  process.exit(1);
}

if (password.length < 10) {
  console.warn('⚠  Short passwords are easy to guess. Use at least 12 characters.\n');
}

const hash = bcrypt.hashSync(password, 12);
const escaped = hash.replace(/\$/g, '\\$');
const base64 = Buffer.from(hash, 'utf8').toString('base64');

console.log('Bcrypt hash (cost 12):\n  %s\n', hash);
console.log('Recommended — paste into .env.local:\n  ADMIN_PASSWORD_BASE64=%s\n', base64);
console.log('Alternative — note the escaped $ characters:\n  ADMIN_PASSWORD_HASH=%s\n', escaped);
console.log('Keep both the password and this output private.');
