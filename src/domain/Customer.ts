export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export class Customer {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly status: CustomerStatus,
    public readonly createdAt: Date,
    public readonly passwordHash?: string,
    public readonly emailVerified: boolean = false,
    public readonly verificationToken?: string,
    public readonly verificationTokenExpiry?: Date,
    public readonly resetToken?: string,
    public readonly resetTokenExpiry?: Date
  ) {}

  canPlaceOrder(): boolean {
    return this.status === CustomerStatus.ACTIVE;
  }

  canLogin(): boolean {
    return this.status === CustomerStatus.ACTIVE && this.emailVerified;
  }

  isEmailVerified(): boolean {
    return this.emailVerified;
  }

  verifyEmail(): Customer {
    return new Customer(
      this.id,
      this.email,
      this.name,
      this.status,
      this.createdAt,
      this.passwordHash,
      true,
      undefined,
      undefined,
      this.resetToken,
      this.resetTokenExpiry
    );
  }

  withVerificationToken(token: string, expiry: Date): Customer {
    return new Customer(
      this.id,
      this.email,
      this.name,
      this.status,
      this.createdAt,
      this.passwordHash,
      this.emailVerified,
      token,
      expiry,
      this.resetToken,
      this.resetTokenExpiry
    );
  }

  withResetToken(token: string, expiry: Date): Customer {
    return new Customer(
      this.id,
      this.email,
      this.name,
      this.status,
      this.createdAt,
      this.passwordHash,
      this.emailVerified,
      this.verificationToken,
      this.verificationTokenExpiry,
      token,
      expiry
    );
  }

  withPasswordHash(passwordHash: string): Customer {
    return new Customer(
      this.id,
      this.email,
      this.name,
      this.status,
      this.createdAt,
      passwordHash,
      this.emailVerified,
      this.verificationToken,
      this.verificationTokenExpiry,
      this.resetToken,
      this.resetTokenExpiry
    );
  }

  clearVerificationToken(): Customer {
    return new Customer(
      this.id,
      this.email,
      this.name,
      this.status,
      this.createdAt,
      this.passwordHash,
      this.emailVerified,
      undefined,
      undefined,
      this.resetToken,
      this.resetTokenExpiry
    );
  }

  clearResetToken(): Customer {
    return new Customer(
      this.id,
      this.email,
      this.name,
      this.status,
      this.createdAt,
      this.passwordHash,
      this.emailVerified,
      this.verificationToken,
      this.verificationTokenExpiry,
      undefined,
      undefined
    );
  }
}

