export async function activateLicense(
  key: string,
  instanceName: string
): Promise<{
  valid: boolean
  instanceId: string
  error?: 'reached_activation_limit' | 'expired' | 'not_found'
}> {
  void key
  void instanceName
  return { valid: false, instanceId: '', error: 'not_found' }
}

export async function deactivateLicense(key: string, instanceId: string) {
  void key
  void instanceId
}

type ValidateLicenseKeyResponse = {
  valid: boolean
}

export async function validateLicense(key: string, instanceId: string): Promise<ValidateLicenseKeyResponse> {
  void key
  void instanceId
  return { valid: false }
}
