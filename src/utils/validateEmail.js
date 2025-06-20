export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/;
  if (!emailRegex.test(email)) return false;
  const [local, domain] = email.split('@');
  if (!local || !domain) return false;
  return local.length <= 64 && domain.length <= 255;
}
