type AttemptBucket = {
  count: number;
  blockedUntil?: number;
};

const employeeAttempts = new Map<string, AttemptBucket>();
const customerAttempts = new Map<string, AttemptBucket>();

function getBucket(store: Map<string, AttemptBucket>, key: string) {
  const bucket = store.get(key) ?? { count: 0 };
  if (bucket.blockedUntil && bucket.blockedUntil <= Date.now()) {
    bucket.blockedUntil = undefined;
    bucket.count = 0;
  }
  store.set(key, bucket);
  return bucket;
}

function registerFailure(store: Map<string, AttemptBucket>, key: string, maxAttempts: number, blockMinutes: number) {
  const bucket = getBucket(store, key);
  bucket.count += 1;
  if (bucket.count >= maxAttempts) {
    bucket.blockedUntil = Date.now() + blockMinutes * 60_000;
    bucket.count = 0;
  }
}

function clearFailures(store: Map<string, AttemptBucket>, key: string) {
  store.delete(key);
}

function getBlockMessage(bucket: AttemptBucket, scope: string) {
  if (!bucket.blockedUntil || bucket.blockedUntil <= Date.now()) {
    return null;
  }
  const remainingMinutes = Math.max(1, Math.ceil((bucket.blockedUntil - Date.now()) / 60_000));
  return `Acceso ${scope} bloqueado temporalmente. Intente de nuevo en ${remainingMinutes} minuto(s).`;
}

export function getEmployeeAuthBlock(key: string) {
  return getBlockMessage(getBucket(employeeAttempts, key), "corporativo");
}

export function getCustomerAuthBlock(key: string) {
  return getBlockMessage(getBucket(customerAttempts, key), "de cliente");
}

export function registerEmployeeAuthFailure(key: string) {
  registerFailure(employeeAttempts, key, 6, 15);
}

export function registerCustomerAuthFailure(key: string) {
  registerFailure(customerAttempts, key, 7, 10);
}

export function clearEmployeeAuthFailures(key: string) {
  clearFailures(employeeAttempts, key);
}

export function clearCustomerAuthFailures(key: string) {
  clearFailures(customerAttempts, key);
}

export function validateStrongPassword(password: string) {
  const hasUppercase = /[A-ZÁÉÍÓÚÑ]/.test(password);
  const hasLowercase = /[a-záéíóúñ]/.test(password);
  const hasDigit = /\d/.test(password);
  return password.length >= 12 && hasUppercase && hasLowercase && hasDigit;
}
