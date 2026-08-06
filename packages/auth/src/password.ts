import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  // ponytail: bcrypt cost 10 = library default; raise only if hash speed ever matters
  return bcrypt.hash(password, 10);
}

export async function verifyPassword({
  hash,
  password,
}: {
  hash: string;
  password: string;
}): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
