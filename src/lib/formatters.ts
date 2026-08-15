export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function isValidCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length === 0) return true
  if (digits.length !== 11) return false
  if (/^(\d)\1+$/.test(digits)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i)
  let rev = 11 - (sum % 11)
  if (rev >= 10) rev = 0
  if (rev !== parseInt(digits[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i)
  rev = 11 - (sum % 11)
  if (rev >= 10) rev = 0
  return rev === parseInt(digits[10])
}

export function addYearsToDate(years = 1, from = new Date()): string {
  const date = new Date(from)
  date.setFullYear(date.getFullYear() + years)
  return toISODateLocal(date)
}

export function toISODateLocal(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateBR(dateStr: string | null | undefined, empty = '--/--/----'): string {
  if (!dateStr) return empty
  const [year, month, day] = dateStr.split('T')[0].split('-')
  if (!year || !month || !day) return empty
  return `${day}/${month}/${year}`
}

export function isDateOnOrAfterToday(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  const iso = dateStr.split('T')[0]
  return iso >= toISODateLocal()
}

export function isMinor(birthDate: string | null | undefined, today = new Date()): boolean {
  if (!birthDate) return false
  const [year, month, day] = birthDate.split('T')[0].split('-').map(Number)
  if (!year || !month || !day) return false
  const eighteenth = new Date(year + 18, month - 1, day)
  const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return todayLocal < eighteenth
}

export function formatPhoneBR(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function isValidPhoneBR(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  return digits.length === 10 || digits.length === 11
}

export function getGuardianValidationError(
  birthDate: string | null | undefined,
  name: string,
  phone: string,
): string | null {
  if (!isMinor(birthDate)) return null
  if (!name.trim()) return 'Informe o nome do responsável do menor de idade.'
  if (!isValidPhoneBR(phone)) return 'Informe um telefone válido do responsável.'
  return null
}
