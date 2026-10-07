const persianDigits = '۰۱۲۳۴۵۶۷۸۹'
const arabicDigits = '٠١٢٣٤٥٦٧٨٩'

export function toPersianDigits(value: string | number) {
  return String(value).replace(/[0-9٠-٩]/g, (digit) => {
    const latin = digit.charCodeAt(0) - 48
    if (latin >= 0 && latin <= 9) return persianDigits[latin] ?? digit
    return persianDigits[arabicDigits.indexOf(digit)] ?? digit
  })
}
