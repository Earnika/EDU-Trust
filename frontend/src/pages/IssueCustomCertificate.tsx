import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useContract } from '../hooks/useContract';
import { Palette, User, Upload, Plus, X, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react';
import { generateCustomCertificatePDF, CustomCertificateData } from '../utils/certificatePDFGenerator';

interface CustomField {
    name: string;
    value: string;
}

const IssueCustomCertificate: React.FC = () => {
    const { account, isConnected } = useWeb3();
    const { getSignedContracts } = useContract();
    const [formData, setFormData] = useState({
        studentAddress: '',
        templateId: 'custom-template-1',
        ipfsHash: ''
    });
    const [customFields, setCustomFields] = useState<CustomField[]>([
        { name: 'Student Name', value: '' },
        { name: 'Certificate Title', value: '' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [mintedTokenId, setMintedTokenId] = useState<string | null>(null);

    const templates = [
        { id: 'custom-template-1', name: 'Workshop Completion', description: 'For workshop participants' },
        { id: 'custom-template-2', name: 'Internship Certificate', description: 'For internship completion' },
        { id: 'custom-template-3', name: 'Participation Certificate', description: 'For event participation' },
        { id: 'custom-template-4', name: 'Training Certificate', description: 'For training programs' },
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFieldChange = (index: number, field: 'name' | 'value', value: string) => {
        const newFields = [...customFields];
        newFields[index][field] = value;
        setCustomFields(newFields);
    };

    const addField = () => {
        setCustomFields([...customFields, { name: '', value: '' }]);
    };

    const removeField = (index: number) => {
        if (customFields.length > 1) {
            setCustomFields(customFields.filter((_, i) => i !== index));
        }
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

        // Validate custom fields
        const emptyFields = customFields.filter(f => !f.name.trim() || !f.value.trim());
        if (emptyFields.length > 0) {
            setError('Please fill in all custom field names and values');
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

            const fieldNames = customFields.map(f => f.name);
            const fieldValues = customFields.map(f => f.value);

            // Mint custom certificate
            const tx = await contracts.certificateNFT.mintCustomCertificate(
                formData.studentAddress,
                formData.templateId,
                fieldNames,
                fieldValues,
                formData.ipfsHash
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
            setSuccess(`Custom certificate minted successfully! Token ID: ${tokenId}`);

            // Generate and download PDF
            const selectedTemplate = templates.find(t => t.id === formData.templateId);
            const studentNameField = customFields.find(f => f.name.toLowerCase().includes('name'));

            const pdfData: CustomCertificateData = {
                studentName: studentNameField?.value || 'Student',
                templateName: selectedTemplate?.name || 'Custom Certificate',
                customFields: customFields,
                tokenId: tokenId,
                issuerName: 'EduTrust Platform'
            };

            const pdfBlob = generateCustomCertificatePDF(pdfData);
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `custom-certificate-${tokenId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            // Reset form
            setFormData({
                studentAddress: '',
                templateId: 'custom-template-1',
                ipfsHash: ''
            });
            setCustomFields([
                { name: 'Student Name', value: '' },
                { name: 'Certificate Title', value: '' }
            ]);
        } catch (err: any) {
            console.error('Error minting custom certificate:', err);
            setError(err.message || 'Failed to mint custom certificate');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isConnected) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md mx-auto">
                    <Palette className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Connect Wallet Required
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        Please connect your wallet to issue custom certificates.
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
                    <Palette className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Issue Custom Certificate
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                    Create flexible certificates with custom fields
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                        Certificate Builder
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
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                placeholder="0x..."
                                required
                            />
                        </div>

                        {/* Template Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Palette className="w-4 h-4 inline mr-2" />
                                Certificate Template
                            </label>
                            <select
                                name="templateId"
                                value={formData.templateId}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                required
                            >
                                {templates.map(template => (
                                    <option key={template.id} value={template.id}>
                                        {template.name} - {template.description}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Custom Fields */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Custom Fields
                                </label>
                                <button
                                    type="button"
                                    onClick={addField}
                                    className="flex items-center space-x-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add Field</span>
                                </button>
                            </div>

                            <div className="space-y-3">
                                {customFields.map((field, index) => (
                                    <div key={index} className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={field.name}
                                            onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                            placeholder="Field Name (e.g., Duration)"
                                            required
                                        />
                                        <input
                                            type="text"
                                            value={field.value}
                                            onChange={(e) => handleFieldChange(index, 'value', e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                            placeholder="Field Value (e.g., 6 months)"
                                            required
                                        />
                                        {customFields.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeField(index)}
                                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
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
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
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
                            className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Minting...</span>
                                </>
                            ) : (
                                <>
                                    <Palette className="w-4 h-4" />
                                    <span>Mint Custom Certificate</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Instructions */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Template Examples
                        </h3>
                        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                            <div>
                                <strong className="text-gray-900 dark:text-white">Workshop:</strong> Duration, Topic, Instructor
                            </div>
                            <div>
                                <strong className="text-gray-900 dark:text-white">Internship:</strong> Company, Role, Duration
                            </div>
                            <div>
                                <strong className="text-gray-900 dark:text-white">Participation:</strong> Event Name, Date, Role
                            </div>
                            <div>
                                <strong className="text-gray-900 dark:text-white">Training:</strong> Program, Skills, Hours
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-4">
                            💡 Tips
                        </h3>
                        <ul className="space-y-2 text-sm text-indigo-800 dark:text-indigo-200">
                            <li>• Add as many custom fields as needed</li>
                            <li>• Field names should be descriptive</li>
                            <li>• Values are stored on-chain in events</li>
                            <li>• Full metadata goes to IPFS</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IssueCustomCertificate;
