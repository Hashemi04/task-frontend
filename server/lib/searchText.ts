const letterVariants: Record<string, string> = {
  ي: 'ی',
  ى: 'ی',
  ئ: 'ی',
  ك: 'ک',
  ة: 'ه',
  ۀ: 'ه',
  أ: 'ا',
  إ: 'ا',
  آ: 'ا',
  ؤ: 'و',
}

const persianDigits = '۰۱۲۳۴۵۶۷۸۹'
const arabicDigits = '٠١٢٣٤٥٦٧٨٩'

// Spaces and half-spaces are dropped so "می‌کنیم", "می کنیم" and "میکنیم" match.
export function searchKey(value: string) {
  return value
    .normalize('NFC')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[يىئكةۀأإآؤ]/g, (letter) => letterVariants[letter] ?? letter)
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)))
    .replace(/[\u200B-\u200F\u00A0\s]+/g, '')
    .toLowerCase()
}
