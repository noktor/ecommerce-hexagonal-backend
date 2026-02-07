import { useState, useEffect } from 'react';
import { authService } from '../services/auth';

interface EmailVerificationProps {
  token?: string;
}

export function EmailVerification({ token: tokenProp }: EmailVerificationProps) {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [actualToken, setActualToken] = useState<string | null>(null);

  // Extract token from URL if not provided as prop
  useEffect(() => {
    if (tokenProp) {
      setActualToken(tokenProp);
      return;
    }

    // Try to extract token from URL
    try {
      const urlParams = new URLSearchParams(window.location.search);
      let token = urlParams.get('token');
      
      if (!token) {
        const pathname = window.location.pathname;
        const match = pathname.match(/\/verify-email\/([^\/\?]+)/);
        if (match) {
          token = match[1];
        }
      }
      
      if (token) {
        setActualToken(token);
      } else {
        setStatus('error');
        setMessage('No verification token found in the URL.');
      }
    } catch (error) {
      console.error('Error extracting token from URL:', error);
      setStatus('error');
      setMessage('Error processing verification link.');
    }
  }, [tokenProp]);

  // Verify email when token is available
  useEffect(() => {
    const verifyEmail = async () => {
      if (!actualToken || actualToken.trim() === '') {
        return; // Wait for token extraction
      }

      try {
        console.log('Verifying email with token:', actualToken.substring(0, 20) + '...');
        await authService.verifyEmail(actualToken);
        setStatus('success');
        setMessage('Email verified successfully! You can now log in.');
      } catch (error) {
        console.error('Email verification error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Email verification failed';
        
        // Check if email is already verified (this is actually a success case)
        if (errorMessage.includes('already verified') || errorMessage.includes('Email already verified')) {
          setStatus('success');
          setMessage('Email already verified. You can now log in.');
        } else {
          setStatus('error');
          setMessage(errorMessage);
        }
      }
    };

    if (actualToken) {
      verifyEmail();
    }
  }, [actualToken]);

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px', textAlign: 'center' }}>
      {status === 'verifying' && (
        <>
          <h2>Verifying your email...</h2>
          <p>Please wait while we verify your email address.</p>
        </>
      )}
      {status === 'success' && (
        <>
          <h2 style={{ color: '#2563eb' }}>✅ Email Verified!</h2>
          <p style={{ marginTop: '20px' }}>{message}</p>
          <a
            href="/login"
            style={{
              display: 'inline-block',
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#2563eb',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px'
            }}
          >
            Go to Login
          </a>
        </>
      )}
      {status === 'error' && (
        <>
          <h2 style={{ color: '#c33' }}>❌ Verification Failed</h2>
          <p style={{ marginTop: '20px' }}>{message}</p>
          <a
            href="/login"
            style={{
              display: 'inline-block',
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#2563eb',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px'
            }}
          >
            Go to Login
          </a>
        </>
      )}
    </div>
  );
}

