/**
 * WebAuthn Biometric & Passkey Helper for Family Expense Tracker
 */

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Checks whether the platform has a biometric / user-verifying authenticator available.
 */
export async function isBiometricSupported(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false;
  }
  try {
    if (window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Enrolls and registers a platform biometric credential (fingerprint / Face ID / Touch ID / Windows Hello)
 * Returns the base64-encoded credential ID.
 */
export async function registerBiometricCredential(
  userId: string,
  displayName: string
): Promise<string> {
  if (!window.PublicKeyCredential || !navigator.credentials) {
    throw new Error('Biometric authentication is not supported on this browser or device.');
  }

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const userIdBuffer = new TextEncoder().encode(userId);

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: {
        name: 'Family Expense Tracker',
        id: window.location.hostname || undefined,
      },
      user: {
        id: userIdBuffer,
        name: userId,
        displayName: displayName || 'Family Member',
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },   // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    },
  })) as PublicKeyCredential | null;

  if (!credential || !credential.rawId) {
    throw new Error('No credential was returned by the device.');
  }

  return arrayBufferToBase64(credential.rawId);
}

/**
 * Verifies the user using their enrolled biometric credential.
 */
export async function verifyBiometricCredential(credentialIdBase64?: string | null): Promise<boolean> {
  if (!window.PublicKeyCredential || !navigator.credentials) {
    throw new Error('Biometric authentication is not supported.');
  }

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const allowCredentials = [];
  if (credentialIdBase64) {
    try {
      const buffer = base64ToArrayBuffer(credentialIdBase64);
      allowCredentials.push({
        id: buffer,
        type: 'public-key' as const,
      });
    } catch {
      // ignore invalid base64 and fall back to open challenge
    }
  }

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      timeout: 60000,
      userVerification: 'required',
      rpId: window.location.hostname || undefined,
      allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
    },
  });

  return !!assertion;
}
