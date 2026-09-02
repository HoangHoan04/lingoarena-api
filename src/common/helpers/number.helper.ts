const formatAmountToken = ({
  stringNumber,
  tokenDecimals,
}: {
  stringNumber: string;
  tokenDecimals: number;
}) => {
  const numberValue = BigInt(stringNumber);
  const divisor = BigInt('1'.padEnd(tokenDecimals + 1, '0'));
  const scaledNumber = Number(numberValue / divisor);
  return scaledNumber;
};

function calculateTotalWithVAT(amount: number, vatRate = 10): number {
  const vat = (amount * vatRate) / 100;
  const total = amount + vat;

  return parseFloat(total.toFixed(2));
}

function toStripeAmount(amount: number): number {
  return Math.round(amount * 100);
}
const parseMoney = (val: any): number => {
  if (!val) return 0;

  if (typeof val === 'number') return val;

  const normalized = String(val).replace(/\./g, '').replace(/,/g, '.');

  return Number(normalized) || 0;
};

export function toNumber(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export const numberHelper = {
  formatAmountToken,
  calculateTotalWithVAT,
  toStripeAmount,
  parseMoney,
  toNumber,
};
