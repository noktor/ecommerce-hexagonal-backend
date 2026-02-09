export interface TokenPayload {
  userId: string;
  email: string;
  role?: 'user' | 'retailer';
}

export interface TokenService {
  generateToken(payload: TokenPayload): string;
  verifyToken(token: string): TokenPayload | null;
}
