import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useContract } from '../hooks/useContract';
import { useRoleAccess } from '../hooks/useRoleAccess';
import { CheckCircle, XCircle, Loader2, Shield, Users, FileText, Award } from 'lucide-react';

const TestDashboard: React.FC = () => {
    const { account, isConnected } = useWeb3();
    const { contracts, getSignedContracts } = useContract();
    const { roles, isLoading: rolesLoading } = useRoleAccess();
    const [tests, setTests] = useState<Record<string, 'pending' | 'running' | 'success' | 'error'>>({});
    const [results, setResults] = useState<Record<string, string>>({});

    const updateTest = (testName: string, status: 'pending' | 'running' | 'success' | 'error', result?: string) => {
        setTests(prev => ({ ...prev, [testName]: status }));
        if (result) {
            setResults(prev => ({ ...prev, [testName]: result }));
        }
    };

    const runTest = async (testName: string, testFn: () => Promise<string>) => {
        updateTest(testName, 'running');
        try {
            const result = await testFn();
            updateTest(testName, 'success', result);
        } catch (error: any) {
            updateTest(testName, 'error', error.message || 'Test failed');
        }
    };

    const testContractConnection = async () => {
        if (!contracts?.certificateNFT) throw new Error('Contract not loaded');
        const maxBatchSize = await contracts.certificateNFT.MAX_BATCH_SIZE();
        return `Connected! Max batch size: ${maxBatchSize.toString()}`;
    };

    const testRoleAccess = async () => {
        if (rolesLoading) throw new Error('Roles still loading');
        const rolesList = [];
        if (roles.isAdmin) rolesList.push('ADMIN');
        if (roles.isMinter) rolesList.push('MINTER');
        if (roles.isVerifier) rolesList.push('VERIFIER');
        return rolesList.length > 0 ? `Roles: ${rolesList.join(', ')}` : 'No roles assigned';
    };

    const testSingleMint = async () => {
        const signedContracts = getSignedContracts();
        if (!signedContracts?.certificateNFT || !account) throw new Error('Not connected');

        const tx = await signedContracts.certificateNFT.mintCertificate(
            account,
            'Test Course',
            'A+',
            `QmTest${Date.now()}`
        );
        const receipt = await tx.wait();
        return `Minted! Tx: ${receipt.hash.slice(0, 10)}...`;
    };

    const testBatchMint = async () => {
        const signedContracts = getSignedContracts();
        if (!signedContracts?.certificateNFT || !account) throw new Error('Not connected');

        const students = [account, account];
        const courses = ['Course 1', 'Course 2'];
        const grades = ['A', 'B'];
        const hashes = [`QmBatch1${Date.now()}`, `QmBatch2${Date.now()}`];

        const tx = await signedContracts.certificateNFT.mintCertificatesBatch(
            students,
            courses,
            grades,
            hashes
        );
        const receipt = await tx.wait();
        return `Batch minted 2 certs! Tx: ${receipt.hash.slice(0, 10)}...`;
    };

    const testVerification = async () => {
        if (!contracts?.certificateNFT || !account) throw new Error('Not connected');

        const studentCerts = await contracts.certificateNFT.getStudentCertificates(account);
        if (studentCerts.length === 0) throw new Error('No certificates to verify');

        const tokenId = studentCerts[0];
        const [isValid, ipfsUri, certType] = await contracts.certificateNFT.verifyCertificate(tokenId);

        return `Token #${tokenId}: ${isValid ? '✓ Valid' : '✗ Invalid'}, Type: ${certType}, URI: ${ipfsUri.slice(0, 15)}...`;
    };

    const testGetStudentCerts = async () => {
        if (!contracts?.certificateNFT || !account) throw new Error('Not connected');

        const certs = await contracts.certificateNFT.getStudentCertificates(account);
        return `Found ${certs.length} certificate(s) for your address`;
    };

    const runAllTests = async () => {
        await runTest('contract', testContractConnection);
        await runTest('roles', testRoleAccess);
        await runTest('getCerts', testGetStudentCerts);
        // Only run minting tests if user has minter role
        if (roles.isMinter || roles.isAdmin) {
            await runTest('singleMint', testSingleMint);
            await runTest('batchMint', testBatchMint);
        }
        await runTest('verification', testVerification);
    };

    const TestRow = ({ name, label, icon: Icon }: { name: string; label: string; icon: any }) => {
        const status = tests[name] || 'pending';
        const result = results[name];

        return (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
                        {result && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{result}</p>
                        )}
                    </div>
                </div>
                <div>
                    {status === 'pending' && (
                        <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600" />
                    )}
                    {status === 'running' && (
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    )}
                    {status === 'success' && (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                    )}
                    {status === 'error' && (
                        <XCircle className="w-6 h-6 text-red-500" />
                    )}
                </div>
            </div>
        );
    };

    if (!isConnected) {
        return (
            <div className="max-w-2xl mx-auto text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Connect Wallet to Test
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Please connect your wallet to run contract tests
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Contract Test Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Test all contract features and verify deployment
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Connection Status
                    </h2>
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Connected</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Wallet Address</p>
                        <p className="font-mono text-sm text-gray-900 dark:text-white mt-1">
                            {account?.slice(0, 10)}...{account?.slice(-8)}
                        </p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Contract Address</p>
                        <p className="font-mono text-sm text-gray-900 dark:text-white mt-1">
                            {import.meta.env.VITE_CERTIFICATE_NFT_ADDRESS?.slice(0, 10)}...
                        </p>
                    </div>
                </div>

                <button
                    onClick={runAllTests}
                    disabled={Object.values(tests).some(t => t === 'running')}
                    className="w-full btn-primary flex items-center justify-center space-x-2 mb-6"
                >
                    {Object.values(tests).some(t => t === 'running') ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Running Tests...</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Run All Tests</span>
                        </>
                    )}
                </button>

                <div className="space-y-3">
                    <TestRow name="contract" label="Contract Connection" icon={Shield} />
                    <TestRow name="roles" label="Role Access Check" icon={Users} />
                    <TestRow name="getCerts" label="Get Student Certificates" icon={FileText} />
                    {(roles.isMinter || roles.isAdmin) && (
                        <>
                            <TestRow name="singleMint" label="Single Certificate Mint" icon={Award} />
                            <TestRow name="batchMint" label="Batch Certificate Mint (2 certs)" icon={Award} />
                        </>
                    )}
                    <TestRow name="verification" label="Certificate Verification" icon={CheckCircle} />
                </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Note:</strong> Minting tests require MINTER_ROLE or ADMIN_ROLE. If you see "No roles assigned",
                    ask the contract deployer to grant you the MINTER_ROLE.
                </p>
            </div>
        </div>
    );
};

export default TestDashboard;
