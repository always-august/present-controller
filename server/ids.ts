import { randomBytes } from "node:crypto";

// 헷갈리는 글자(0/o, 1/l/i)를 뺀 알파벳
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function randomId(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

export const newRoomId = () => randomId(8);
export const newControllerKey = () => randomId(20);
export const newEntityId = () => randomId(10);
