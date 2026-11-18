interface ScaledDecimal {
  negative: boolean;
  digits: bigint;
  scale: number;
}

function parseDecimal(value: string): ScaledDecimal {
  const trimmed = value.trim();
  const negative = trimmed.startsWith('-');
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [whole, fraction = ''] = unsigned.split('.');

  return {
    negative,
    digits: BigInt(`${whole || '0'}${fraction}`),
    scale: fraction.length,
  };
}

function formatDecimal(
  negative: boolean,
  digits: bigint,
  scale: number,
): string {
  const sign = negative && digits !== 0n ? '-' : '';
  const raw = digits.toString().padStart(scale + 1, '0');
  if (scale === 0) {
    return `${sign}${raw}`;
  }

  return `${sign}${raw.slice(0, -scale)}.${raw.slice(-scale)}`;
}

export function multiplyDecimal(left: string, right: string): string {
  const a = parseDecimal(left);
  const b = parseDecimal(right);

  return formatDecimal(
    a.negative !== b.negative,
    a.digits * b.digits,
    a.scale + b.scale,
  );
}

export function addDecimal(left: string, right: string): string {
  const a = parseDecimal(left);
  const b = parseDecimal(right);
  const scale = Math.max(a.scale, b.scale);
  const aDigits = a.digits * 10n ** BigInt(scale - a.scale);
  const bDigits = b.digits * 10n ** BigInt(scale - b.scale);
  const signed =
    (a.negative ? -aDigits : aDigits) + (b.negative ? -bDigits : bDigits);
  const negative = signed < 0n;

  return formatDecimal(negative, negative ? -signed : signed, scale);
}

function divideDecimal(
  numerator: string,
  denominator: string,
  scale: number,
): string {
  const a = parseDecimal(numerator);
  const b = parseDecimal(denominator);
  const negative = a.negative !== b.negative;
  const digits =
    (a.digits * 10n ** BigInt(b.scale + scale)) /
    (b.digits * 10n ** BigInt(a.scale));

  return formatDecimal(negative, digits, scale);
}

export function percentageChange(
  current: string,
  previous: string | null,
): string | null {
  if (previous === null || parseDecimal(previous).digits === 0n) {
    return null;
  }

  const difference = addDecimal(current, multiplyDecimal(previous, '-1'));
  return divideDecimal(multiplyDecimal(difference, '100'), previous, 2);
}

export function isNegativeDecimal(value: string): boolean {
  const parsed = parseDecimal(value);
  return parsed.negative && parsed.digits !== 0n;
}
