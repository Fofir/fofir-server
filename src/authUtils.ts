import bcrypt from "bcryptjs";

export async function hashPassword(password: string) {
  const hash = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
  return hash;
}
