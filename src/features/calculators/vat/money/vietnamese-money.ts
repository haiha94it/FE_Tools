/** Phân số thập phân chính xác; không chuyển qua Number/binary float. */
export interface ExactDecimal {
  numerator: bigint;
  denominator: bigint;
}

export type ParseVndResult =
  | { ok: true; value: bigint; normalized: string }
  | { ok: false; reason: "required" | "invalid" | "too_long" };

const MAX_VND_DIGITS = 30;

function greatestCommonDivisor(left: bigint, right: bigint): bigint {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a || 1n;
}

/** Tạo Decimal dạng phân số tối giản, denominator luôn dương. */
export function exactDecimal(numerator: bigint, denominator = 1n): ExactDecimal {
  if (denominator === 0n) throw new RangeError("Decimal denominator must not be zero");
  const sign = denominator < 0n ? -1n : 1n;
  const gcd = greatestCommonDivisor(numerator, denominator);
  return {
    numerator: (numerator / gcd) * sign,
    denominator: (denominator / gcd) * sign,
  };
}

/** ROUND_HALF_UP về integer; dùng tại output boundary. */
export function roundHalfUp(value: ExactDecimal): bigint {
  const { numerator, denominator } = exactDecimal(
    value.numerator,
    value.denominator,
  );
  const negative = numerator < 0n;
  const absolute = negative ? -numerator : numerator;
  const quotient = absolute / denominator;
  const remainder = absolute % denominator;
  const rounded = remainder * 2n >= denominator ? quotient + 1n : quotient;
  return negative ? -rounded : rounded;
}

/** Parse VND nguyên đồng; chỉ nhận digits hoặc nhóm nghìn bằng dot/space. */
export function parseVnd(raw: string): ParseVndResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: "required" };

  const withoutCurrency = trimmed.replace(/\s*(?:₫|đ|vnd)\s*$/iu, "").trim();
  if (!withoutCurrency) return { ok: false, reason: "required" };
  if (withoutCurrency.includes(",")) return { ok: false, reason: "invalid" };

  let digits: string;
  if (/^\d+$/u.test(withoutCurrency)) {
    digits = withoutCurrency;
  } else if (/^\d{1,3}(?:\.\d{3})+$/u.test(withoutCurrency)) {
    digits = withoutCurrency.replaceAll(".", "");
  } else if (/^\d{1,3}(?: \d{3})+$/u.test(withoutCurrency)) {
    digits = withoutCurrency.replaceAll(" ", "");
  } else {
    return { ok: false, reason: "invalid" };
  }

  if (digits.length > MAX_VND_DIGITS) return { ok: false, reason: "too_long" };
  const normalized = digits.replace(/^0+(?=\d)/u, "");
  return { ok: true, value: BigInt(normalized), normalized };
}

/** Format integer VND theo nhóm nghìn Việt Nam. */
export function formatVnd(value: bigint, includeCurrency = true): string {
  const negative = value < 0n;
  const digits = (negative ? -value : value).toString();
  const groups: string[] = [];
  for (let end = digits.length; end > 0; end -= 3) {
    groups.unshift(digits.slice(Math.max(0, end - 3), end));
  }
  const formatted = `${negative ? "-" : ""}${groups.join(".")}`;
  return includeCurrency ? `${formatted} ₫` : formatted;
}

