import bcrypt from 'bcryptjs';

let cachedHash: string | null = null;

function getAdminHash(): string {
  if (cachedHash) return cachedHash;
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) throw new Error('ADMIN_PASSWORD not configured');
  cachedHash = bcrypt.hashSync(pw, 10);
  return cachedHash;
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  const envUser = process.env.ADMIN_USERNAME;
  if (!envUser) return false;
  if (username !== envUser) return false;
  return bcrypt.compareSync(password, getAdminHash());
}
