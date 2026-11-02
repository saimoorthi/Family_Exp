/**
 * Date formatter for Indian standard format: DD-MM-YY
 * Example: 2026-11-02 -> 02-11-26
 */
export function formatDate(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '';
  
  // If string in YYYY-MM-DD format, parse parts directly to prevent timezone shift
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    const [year, month, day] = dateInput.substring(0, 10).split('-');
    return `${day}-${month}-${year.slice(-2)}`;
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

/**
 * Date & Time formatter: DD-MM-YY at HH:MM AM/PM
 * Example: 02-11-26 at 03:45 PM
 */
export function formatDateTime(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  const time = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${day}-${month}-${year} at ${time}`;
}

