export interface TokenPayload {
  userId: string;
  email: string;
}

export interface TokenService {
  generateToken(payload: TokenPayload): string;
  verifyToken(token: string): TokenPayload | null;
}

