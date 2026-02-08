import * as jwt from 'jsonwebtoken';
import type { TokenPayload, TokenService } from '../../domain/services/TokenService';

export class JWTTokenService implements TokenService {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor(secret: string, expiresIn: string = '7d') {
    this.secret = secret;
    this.expiresIn = expiresIn;
  }

  generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn } as jwt.SignOptions);
  }

  verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret) as TokenPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }
}
