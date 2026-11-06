import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";

const KEY_LENGTH = 64;

function deriveKey(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, KEY_LENGTH, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 8 || password.length > 128) {
    throw new Error("Password length must be between 8 and 128 characters");
  }
  const salt = randomBytes(16).toString("hex");
  const key = await deriveKey(password, salt);
  return `scrypt$${salt}$${key.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [algorithm, salt, expectedHex, ...extra] = storedHash.split("$");
  if (
    algorithm !== "scrypt" ||
    !salt ||
    !/^[a-f0-9]{32}$/.test(salt) ||
    !expectedHex ||
    !/^[a-f0-9]{128}$/.test(expectedHex) ||
    extra.length > 0 ||
    password.length > 128
  ) {
    return false;
  }

  const actual = await deriveKey(password, salt);
  const expected = Buffer.from(expectedHex, "hex");
  return timingSafeEqual(actual, expected);
}
