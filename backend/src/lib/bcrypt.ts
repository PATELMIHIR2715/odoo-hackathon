import bcrypt from 'bcrypt';

export const hashValue = (value: string) => bcrypt.hash(value, 12);
export const verifyValue = (value: string, hash: string) => bcrypt.compare(value, hash);
