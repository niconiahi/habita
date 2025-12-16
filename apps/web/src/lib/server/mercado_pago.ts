import type { OAuth2Tokens } from "arctic";
import { CodeChallengeMethod, OAuth2Client } from "arctic";
import { createOAuth2Request, sendTokenRequest } from "arctic/dist/request";

const authorizationEndpoint = "https://auth.mercadopago.com.ar/authorization";
const tokenEndpoint = "https://api.mercadopago.com/oauth/token";

export class MercadoPago {
  public clientId: string;

  private client: OAuth2Client;
  private clientSecret: string;
  private redirectURI: string;

  constructor(clientId: string, clientSecret: string, redirectURI: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectURI = redirectURI;
    this.client = new OAuth2Client(clientId, clientSecret, redirectURI);
  }

  public createAuthorizationURL(
    state: string,
    codeVerifier: string,
    scopes: string[]
  ): URL {
    const url = this.client.createAuthorizationURLWithPKCE(
      authorizationEndpoint,
      state,
      CodeChallengeMethod.S256,
      codeVerifier,
      scopes
    );
    return url;
  }

  public async validateAuthorizationCode(
    code: string,
    codeVerifier: string
  ): Promise<OAuth2Tokens> {
    const bla = await fetch(tokenEndpoint, {
      method: "POST",
      body: JSON.stringify({
        client_secret: this.clientSecret,
        client_id: this.clientId,
        grant_type: "authorization_code",
        code,
        code_verifier: codeVerifier,
        redirect_uri: this.redirectURI
      })
    })
      .then((response) => {
        return response.json();
      })
      .catch((error) => {
        if (error instanceof Error) {
          throw new Error(error.message);
        }
      });
    return bla as OAuth2Tokens;
  }

  public async refreshAccessToken(refreshToken: string): Promise<OAuth2Tokens> {
    const body = new URLSearchParams();
    body.set("grant_type", "refresh_token");
    body.set("refresh_token", refreshToken);
    body.set("client_id", this.clientId);
    body.set("client_secret", this.clientSecret);
    const request = createOAuth2Request(tokenEndpoint, body);
    const tokens = await sendTokenRequest(request);
    return tokens;
  }
}
