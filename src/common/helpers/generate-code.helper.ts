import { customAlphabet, nanoid } from 'nanoid';
import { v4 } from 'uuid';

const uuidNoDash = () => {
  return v4().replace(/-/g, '').toUpperCase();
};

const generateReferralCode = () => {
  return customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')(8);
};

const generateCode = (prefix: string, length: number) => {
  return `${prefix}-${customAlphabet('0123456789')(length)}`.trim().toUpperCase();
};

const generateTicketNumber = () => {
  return customAlphabet('0123456789')(6);
};

const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

const generateSOCode = (quantity?: number, character: string = 'SO') => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);

  const formattedSequence = String(quantity).padStart(6, '0');
  const soCode = `${character}${day}${month}${year}${formattedSequence}`;
  return soCode;
};

export function generateOrderCode(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const id = nanoid(10);
  return `ORD-${date}-${id.toUpperCase()}`;
}

export function generatePaymentTransactionCode(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const id = nanoid(10);
  return `PT-${date}-${id.toUpperCase()}`;
}

export function generateProjectCode(projectName: string, prefix = 'PRJ'): string {
  const initials = projectName
    .split(/\s+/)
    .map(word => word[0]?.toUpperCase())
    .join('');
  return `${prefix}-${initials}-${nanoid(8)}`;
}

export const generateCodeHelper = {
  uuidNoDash,
  generateReferralCode,
  generateTicketNumber,
  generateCode,
  slugify,
  generateOrderCode,
  generatePaymentTransactionCode,
  generateSOCode,
  generateProjectCode,
};
