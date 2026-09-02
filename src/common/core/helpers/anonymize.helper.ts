export class AnonymizeHelper {
  static email(email: string): string {
    if (!email) return '';
    const atIndex = email.indexOf('@');
    if (atIndex <= 0) return email;

    const local = email.substring(0, atIndex);
    const domain = email.substring(atIndex);

    if (local.length <= 2) return email;

    return local[0] + '*'.repeat(local.length - 3) + local.substring(local.length - 2) + domain;
  }

  static phone(phone: string): string {
    if (!phone) return '';
    if (phone.length <= 2) return phone;

    return phone.substring(0, 2) + '*'.repeat(phone.length - 4) + phone.substring(phone.length - 2);
  }

  static date(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');

    return `${day}/${month}/****`;
  }
}
