import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useContract } from '../hooks/useContract';
import { Search, CheckCircle, XCircle, Copy, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';

const VerifyCertificate: React.FC = () => {
  const { isConnected } = useWeb3();
  const { contracts } = useContract();
  const [tokenId, setTokenId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    isValid: boolean;
    ipfsUri: string;
    certType: number;
  } | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenId.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      if (!contracts?.certificateNFT) {
        throw new Error('Contract not loaded. Please refresh the page.');
      }

      // Call verifyCertificate - returns (isValid, ipfsUri, certType)
      const [isValid, ipfsUri, certType] = await contracts.certificateNFT.verifyCertificate(tokenId);

      setResult({
        isValid,
        ipfsUri,
        certType: Number(certType)
      });
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to verify certificate. Please check the token ID.');
    } finally {
      setLoading(false);
    }
  };

  const getCertTypeLabel = (type: number) => {
    const types = ['Regular', 'Semester', 'Achievement', 'Custom'];
    return types[type] || 'Unknown';
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Verify Certificate
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Verify the authenticity of blockchain certificates
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Verification Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Enter Token ID
          </h2>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Search className="w-4 h-4 inline mr-2" />
                Certificate Token ID
              </label>
              <input
                type="text"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter token ID (e.g., 1, 2, 3...)"
                required
              />
            </div>

            {!isConnected && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                  <span className="text-sm text-yellow-800 dark:text-yellow-200">
                    Connect your wallet to verify certificates
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isConnected}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Verify Certificate</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Verification Result */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Verification Result
          </h2>

          {!result && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                Enter a token ID to verify the certificate
              </p>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Verifying certificate...</p>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Status */}
              <div className={`p-4 rounded-lg ${result.isValid
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'
                }`}>
                <div className="flex items-center">
                  {result.isValid ? (
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 mr-3" />
                  )}
                  <div>
                    <h3 className={`font-semibold ${result.isValid
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-red-800 dark:text-red-200'
                      }`}>
                      {result.isValid ? 'Certificate is Valid ✓' : 'Certificate is Invalid ✗'}
                    </h3>
                    <p className={`text-sm ${result.isValid
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-red-700 dark:text-red-300'
                      }`}>
                      {result.isValid
                        ? 'This certificate has been verified on the blockchain'
                        : 'This certificate is invalid or has been revoked'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Certificate Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Certificate Details</h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Token ID:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm text-gray-900 dark:text-white">
                        {tokenId}
                      </span>
                      <button
                        onClick={() => copyToClipboard(tokenId)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Certificate Type:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {getCertTypeLabel(result.certType)}
                    </span>
                  </div>

                  <div className="flex justify-between items-start">
                    <span className="text-gray-600 dark:text-gray-400">IPFS URI:</span>
                    <div className="flex items-center space-x-2 max-w-xs">
                      <span className="font-mono text-xs text-gray-900 dark:text-white break-all">
                        {result.ipfsUri}
                      </span>
                      <button
                        onClick={() => copyToClipboard(result.ipfsUri)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex-shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => window.open(`https://sepolia.etherscan.io/token/${import.meta.env.VITE_CERTIFICATE_NFT_ADDRESS}?a=${tokenId}`, '_blank')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View on Etherscan</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          How to Verify
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Step 1</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connect your wallet using the button in the header
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Step 2</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter the certificate token ID you want to verify
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Step 3</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click "Verify Certificate" to check its authenticity
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyCertificate;
