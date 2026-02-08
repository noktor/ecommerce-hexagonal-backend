export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface PasswordHistory {
  hash: string;
  changedAt: Date;
}

export class Customer {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly status: CustomerStatus,
    public readonly createdAt: Date,
    public readonly passwordHash?: string,
    public readonly passwordHistory: PasswordHistory[] = [],
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
      this.passwordHistory,
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
      this.passwordHistory,
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
      this.passwordHistory,
      this.emailVerified,
      this.verificationToken,
      this.verificationTokenExpiry,
      token,
      expiry
    );
  }

  /**
   * Updates the password and manages password history following security best practices.
   *
   * Security standard compliance:
   * - NIST SP 800-63B: Prevents password reuse by maintaining history
   * - OWASP: Recommends keeping last 3-5 passwords
   *
   * @param passwordHash - The new hashed password
   * @param maxHistorySize - Maximum number of previous passwords to keep (default: 5)
   * @returns New Customer instance with updated password and history
   */
  withPasswordHash(passwordHash: string, maxHistorySize: number = 5): Customer {
    // Add current password to history before replacing it
    // This ensures we can check against it in future password changes
    const newHistory: PasswordHistory[] = [];

    // Add current password to history if it exists
    if (this.passwordHash) {
      newHistory.push({
        hash: this.passwordHash,
        changedAt: new Date(),
      });
    }

    // Combine new history entry with existing history
    // Existing history is already sorted by most recent first
    const existingHistory = this.passwordHistory || [];
    const combinedHistory = [...newHistory, ...existingHistory];

    // Keep only the last N passwords (excluding the new one we're about to set)
    // This prevents unbounded growth of password history
    const trimmedHistory = combinedHistory.slice(0, maxHistorySize - 1);

    return new Customer(
      this.id,
      this.email,
      this.name,
      this.status,
      this.createdAt,
      passwordHash,
      trimmedHistory,
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
      this.passwordHistory,
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
      this.passwordHistory,
      this.emailVerified,
      this.verificationToken,
      this.verificationTokenExpiry,
      undefined,
      undefined
    );
  }
}
