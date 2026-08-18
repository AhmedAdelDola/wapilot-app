export class SsoUtils {
  static parseCallbackUrl(url: string) {
    const urlObj = new URL(url);
    return {
      ssoAuthToken: urlObj.searchParams.get('sso_auth_token'),
      email: urlObj.searchParams.get('email'),
    };
  }

  static handleSsoCallback(params: any, dispatch: any) {
    console.log('[SSO] Callback:', params);
  }
}
