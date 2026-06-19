import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
  const hex = process.env.CNIC_ENCRYPTION_KEY;
  if (!hex || hex.length < 64) {
    return crypto.scryptSync('lumni-default-dev-key', 'salt', 32);
  }
  return Buffer.from(hex.slice(0, 64), 'hex');
}

export function encryptCnic(text: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptCnic(data: string): string {
  const key = getKey();
  const [ivHex, tagHex, encryptedHex] = data.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
}

export function maskCnic(encryptedCnic: string): string {
  try {
    const cnic = decryptCnic(encryptedCnic);
    return cnic.replace(/^(\d{5})-(\d{7})-(\d)$/, '$1-*******-$3');
  } catch {
    return '*****-*******-*';
  }
}
