import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useContract } from '../hooks/useContract';
import { Award, User, Calendar, Users, Upload, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react';
import { generateAchievementCertificatePDF, AchievementCertificateData } from '../utils/certificatePDFGenerator';

const IssueAchievementCertificate: React.FC = () => {
    const { account, isConnected } = useWeb3();
    const { getSignedContracts } = useContract();
    const [formData, setFormData] = useState({
        studentAddress: '',
        studentName: '',
        achievementTitle: '',
        category: 'Academic',
        description: '',
        achievementDate: '',
        verifiers: '',
        ipfsHash: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [mintedTokenId, setMintedTokenId] = useState<string | null>(null);

    const categories = ['Academic', 'Sports', 'Cultural', 'Leadership', 'Research', 'Community Service'];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const generateIPFSHash = () => {
        const mockHash = `Qm${Math.random().toString(36).substr(2, 9)}${Date.now().toString(36)}`;
        setFormData(prev => ({ ...prev, ipfsHash: mockHash }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isConnected || !account) {
            setError('Please connect your wallet first');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const contracts = getSignedContracts();
            if (!contracts?.certificateNFT) {
                throw new Error('Contract not available');
            }

            // Parse verifiers (comma-separated addresses)
            const verifierAddresses = formData.verifiers
                .split(',')
                .map(addr => addr.trim())
                .filter(addr => addr.length > 0);

            // Convert date to timestamp
            const timestamp = formData.achievementDate
                ? Math.floor(new Date(formData.achievementDate).getTime() / 1000)
                : Math.floor(Date.now() / 1000);

            // Mint achievement certificate
            const tx = await contracts.certificateNFT.mintAchievementCertificate(
                formData.studentAddress,
                formData.achievementTitle,
                formData.category,
                formData.ipfsHash,
                verifierAddresses.length > 0 ? verifierAddresses : [account] // Default to minter if no verifiers
            );

            const receipt = await tx.wait();

            // Extract token ID from events
            let tokenId: string = '0';
            try {
                const event = receipt.logs.find((log: any) => {
                    try {
                        const parsed = contracts.certificateNFT.interface.parseLog(log);
                        return parsed?.name === 'CertificateIssued';
                    } catch {
                        return false;
                    }
                });

                if (event) {
                    const parsedEvent = contracts.certificateNFT.interface.parseLog(event);
                    tokenId = parsedEvent?.args.tokenId.toString() || '0';
                }
            } catch (error) {
                console.warn('Could not extract token ID from receipt');
            }

            setMintedTokenId(tokenId);
            setSuccess(`Achievement certificate minted successfully! Token ID: ${tokenId}`);

            // Generate and download PDF
            const pdfData: AchievementCertificateData = {
                studentName: formData.studentName,
                achievementTitle: formData.achievementTitle,
                category: formData.category,
                description: formData.description,
                achievementDate: formData.achievementDate || new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                tokenId: tokenId,
                issuerName: 'EduTrust Platform'
            };

            const pdfBlob = generateAchievementCertificatePDF(pdfData);
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `achievement-certificate-${tokenId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            // Reset form
            setFormData({
                studentAddress: '',
                studentName: '',
                achievementTitle: '',
                category: 'Academic',
                description: '',
                achievementDate: '',
                verifiers: '',
                ipfsHash: ''
            });
        } catch (err: any) {
            console.error('Error minting achievement certificate:', err);
            setError(err.message || 'Failed to mint achievement certificate');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isConnected) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md mx-auto">
                    <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Connect Wallet Required
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        Please connect your wallet to issue achievement certificates.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                    <Award className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Issue Achievement Certificate
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                    Recognize outstanding achievements and accomplishments
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                        Achievement Details
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Student Address */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <User className="w-4 h-4 inline mr-2" />
                                Student Wallet Address
                            </label>
                            <input
                                type="text"
                                name="studentAddress"
                                value={formData.studentAddress}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                                placeholder="0x..."
                                required
                            />
                        </div>

                        {/* Student Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <User className="w-4 h-4 inline mr-2" />
                                Student Name
                            </label>
                            <input
                                type="text"
                                name="studentName"
                                value={formData.studentName}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                                placeholder="e.g., John Doe"
                                required
                            />
                        </div>

                        {/* Achievement Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Award className="w-4 h-4 inline mr-2" />
                                Achievement Title
                            </label>
                            <input
                                type="text"
                                name="achievementTitle"
                                value={formData.achievementTitle}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                                placeholder="e.g., Best Research Project 2024"
                                required
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Category
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                                required
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                                placeholder="Describe the achievement..."
                            />
                        </div>

                        {/* Achievement Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Calendar className="w-4 h-4 inline mr-2" />
                                Achievement Date
                            </label>
                            <input
                                type="date"
                                name="achievementDate"
                                value={formData.achievementDate}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        {/* Verifiers */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Users className="w-4 h-4 inline mr-2" />
                                Verifiers (Optional)
                            </label>
                            <input
                                type="text"
                                name="verifiers"
                                value={formData.verifiers}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                                placeholder="Comma-separated addresses: 0x123..., 0xabc..."
                            />
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Leave empty to use your address as the default verifier
                            </p>
                        </div>

                        {/* IPFS Hash */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Upload className="w-4 h-4 inline mr-2" />
                                IPFS Hash
                            </label>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    name="ipfsHash"
                                    value={formData.ipfsHash}
                                    onChange={handleInputChange}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="Qm..."
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={generateIPFSHash}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                                >
                                    Generate
                                </button>
                            </div>
                        </div>

                        {/* Error/Success Messages */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                <div className="flex items-center">
                                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                                    <span className="text-red-800 dark:text-red-200">{error}</span>
                                </div>
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                <div className="flex items-center">
                                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                                    <span className="text-green-800 dark:text-green-200">{success}</span>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Minting...</span>
                                </>
                            ) : (
                                <>
                                    <Award className="w-4 h-4" />
                                    <span>Mint Achievement Certificate</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Instructions */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Achievement Categories
                        </h3>
                        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                            <div>
                                <strong className="text-gray-900 dark:text-white">Academic:</strong> Research, publications, academic excellence
                            </div>
                            <div>
                                <strong className="text-gray-900 dark:text-white">Sports:</strong> Athletic achievements, competitions
                            </div>
                            <div>
                                <strong className="text-gray-900 dark:text-white">Cultural:</strong> Arts, music, cultural events
                            </div>
                            <div>
                                <strong className="text-gray-900 dark:text-white">Leadership:</strong> Student leadership, organizing events
                            </div>
                            <div>
                                <strong className="text-gray-900 dark:text-white">Research:</strong> Research projects, innovations
                            </div>
                            <div>
                                <strong className="text-gray-900 dark:text-white">Community Service:</strong> Volunteer work, social impact
                            </div>
                        </div>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-4">
                            💡 Tips
                        </h3>
                        <ul className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
                            <li>• Be specific in the achievement title</li>
                            <li>• Add verifiers for credibility</li>
                            <li>• Include achievement date for records</li>
                            <li>• Store detailed info in IPFS metadata</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IssueAchievementCertificate;
