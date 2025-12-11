import React, { useState } from 'react';
import {
    FileText,
    Upload,
    Award,
    TrendingUp,
    Clock,
    CheckCircle,
    Users,
    Zap
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import BulkMintUploader from '../components/BulkMintUploader';
import CertificateTemplateSelector, { CertificateTemplate } from '../components/CertificateTemplateSelector';
import { useRoleAccess } from '../hooks/useRoleAccess';

const MinterPortal: React.FC = () => {
    const { roles, isLoading } = useRoleAccess();
    const [activeTab, setActiveTab] = useState<'quick' | 'bulk' | 'history'>('quick');
    const navigate = useNavigate();

    // Mock stats - replace with actual data fetching logic later
    // We could create a useMinterStats hook
    const stats = {
        totalMinted: 1247,
        thisMonth: 89,
        thisWeek: 23,
        pending: 5,
    };

    const recentMints = [
        { id: 1, student: '0x123...456', course: 'Computer Science', type: 'REGULAR', date: '2024-12-10', tokenId: 1234 },
        { id: 2, student: '0xabc...def', course: 'Data Structures', type: 'SEMESTER', date: '2024-12-10', tokenId: 1235 },
        { id: 3, student: '0x789...012', course: 'Best Project Award', type: 'ACHIEVEMENT', date: '2024-12-09', tokenId: 1236 },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!roles.isMinter && !roles.isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <Award className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Access Denied
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        You need MINTER_ROLE to access this portal
                    </p>
                    <Link to="/" className="text-blue-600 hover:underline">
                        Return to Home
                    </Link>
                </div>
            </div>
        );
    }

    const handleTemplateSelect = (template: CertificateTemplate) => {
        console.log('Selected template:', template);

        // Route based on certificate type
        switch (template.type) {
            case 'REGULAR':
                navigate('/issue');
                break;
            case 'SEMESTER':
                navigate('/admin');
                break;
            case 'ACHIEVEMENT':
                navigate('/issue-achievement');
                break;
            case 'CUSTOM':
                navigate('/issue-custom');
                break;
            default:
                navigate('/issue');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Minter Portal
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Issue and manage certificates efficiently
                            </p>
                        </div>
                        <div className="flex items-center space-x-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <span className="font-medium text-blue-900 dark:text-blue-100">
                                Authorized Minter
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Minted</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {stats.totalMinted.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">This Month</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {stats.thisMonth}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                                <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">This Week</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {stats.thisWeek}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                                <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Pending</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    {stats.pending}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm border border-gray-200 dark:border-gray-700 inline-flex">
                    {[
                        { id: 'quick', label: 'Certificate Templates', icon: Zap },
                        { id: 'bulk', label: 'Bulk Batch Minting', icon: Upload },
                        { id: 'history', label: 'Recent Activity', icon: Clock },
                    ].map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id as any)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === id
                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="transition-all duration-300 ease-in-out">
                    {activeTab === 'quick' && (
                        <div className="space-y-6">
                            <CertificateTemplateSelector
                                onTemplateSelect={handleTemplateSelect}
                            />
                        </div>
                    )}

                    {activeTab === 'bulk' && (
                        <div>
                            <BulkMintUploader
                                onMintComplete={(tokenIds) => {
                                    console.log('Minted tokens:', tokenIds);
                                    setActiveTab('history');
                                }}
                            />
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Recent Minting History
                                </h3>
                                <button className="text-sm text-blue-600 hover:underline">View All</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Token ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Student Address
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Course/Title
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {recentMints.map((mint) => (
                                            <tr key={mint.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="font-mono text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                                                        #{mint.tokenId}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-mono text-gray-600 dark:text-gray-300">
                                                        {mint.student}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-900 dark:text-white font-medium">
                                                        {mint.course}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${mint.type === 'REGULAR' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                                        mint.type === 'SEMESTER' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                            'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                                        }`}>
                                                        {mint.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {mint.date}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <Link
                                                        to={`/verify/${mint.tokenId}`}
                                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                                                    >
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MinterPortal;
