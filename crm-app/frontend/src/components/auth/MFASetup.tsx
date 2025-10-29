/**
 * MFA Setup Component
 * Handles TOTP setup and verification for users
 */

import React, { useState, useEffect } from 'react';
import { Shield, Copy, Check, AlertTriangle, Smartphone } from 'lucide-react';
import { authApiService } from '../../store/enhancedAuthStore';

interface MFASetupProps {
  onSetupComplete?: () => void;
  onCancel?: () => void;
}

interface MFASetupData {
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
  instructions: string[];
}

export const MFASetup: React.FC<MFASetupProps> = ({ onSetupComplete, onCancel }) => {
  const [step, setStep] = useState<'initiate' | 'setup' | 'verify' | 'complete'>('initiate');
  const [setupData, setSetupData] = useState<MFASetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Start MFA Setup Process
   */
  const initiateSetup = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authApiService.post('/auth/mfa/setup', {});
      setSetupData(response);
      setStep('setup');
    } catch (error) {
      setError((error as Error).message || 'Failed to initiate MFA setup');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verify Setup and Enable MFA
   */
  const verifySetup = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await authApiService.post('/auth/mfa/verify-setup', {
        token: verificationCode,
      });

      setBackupCodes(response.backupCodes);
      setStep('complete');
    } catch (error) {
      setError((error as Error).message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Copy backup codes to clipboard
   */
  const copyBackupCodes = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy backup codes:', error);
    }
  };

  /**
   * Copy manual entry key to clipboard
   */
  const copyManualKey = async () => {
    if (setupData?.manualEntryKey) {
      try {
        await navigator.clipboard.writeText(setupData.manualEntryKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy manual key:', error);
      }
    }
  };

  // Auto-start setup when component mounts
  useEffect(() => {
    if (step === 'initiate') {
      initiateSetup();
    }
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Set Up Two-Factor Authentication</h2>
        <p className="text-gray-600 mt-2">Add an extra layer of security to your account</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {step === 'initiate' && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Initializing MFA setup...</p>
        </div>
      )}

      {step === 'setup' && setupData && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Scan QR Code</h3>
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
              <img src={setupData.qrCodeUrl} alt="MFA QR Code" className="w-48 h-48" />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Manual Entry Key
            </h4>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white p-2 rounded border font-mono text-sm">
                {setupData.manualEntryKey}
              </code>
              <button
                onClick={copyManualKey}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="Copy manual entry key"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              {setupData.instructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>

          <button
            onClick={() => setStep('verify')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            I've Set Up My Authenticator App
          </button>
        </div>
      )}

      {step === 'verify' && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Verify Setup</h3>
            <p className="text-gray-600 mb-6">
              Enter the 6-digit code from your authenticator app to complete setup
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full p-3 border border-gray-300 rounded-lg text-center text-lg font-mono"
                maxLength={6}
                autoComplete="off"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('setup')}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={verifySetup}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify & Enable MFA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'complete' && (
        <div className="space-y-6">
          <div className="text-center">
            <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">MFA Enabled Successfully!</h3>
            <p className="text-gray-600">
              Your account is now protected with two-factor authentication
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900 mb-2">Save Your Backup Codes</h4>
                <p className="text-sm text-yellow-800 mb-3">
                  Store these backup codes securely. You can use them to access your account if you
                  lose your authenticator device.
                </p>
                <div className="bg-white p-3 rounded border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Backup Codes:</span>
                    <button
                      onClick={copyBackupCodes}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied ? 'Copied!' : 'Copy All'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded text-center">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              onSetupComplete?.();
            }}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            Complete Setup
          </button>
        </div>
      )}

      {(step === 'setup' || step === 'verify') && (
        <div className="mt-6 text-center">
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 text-sm">
            Cancel Setup
          </button>
        </div>
      )}
    </div>
  );
};
