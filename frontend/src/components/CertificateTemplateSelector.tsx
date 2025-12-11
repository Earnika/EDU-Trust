import React, { useState } from 'react';
import { FileText, Award, Trophy, Sparkles, ChevronRight, Eye } from 'lucide-react';

export interface CertificateTemplate {
    id: string;
    name: string;
    type: 'REGULAR' | 'SEMESTER' | 'ACHIEVEMENT' | 'CUSTOM';
    description: string;
    icon: React.ReactNode;
    color: string;
    fields: string[];
    previewImage?: string;
}

interface CertificateTemplateSelectorProps {
    onTemplateSelect: (template: CertificateTemplate) => void;
}

const templates: CertificateTemplate[] = [
    {
        id: 'regular-v1',
        name: 'Regular Certificate',
        type: 'REGULAR',
        description: 'Standard course completion certificate with student details and grades',
        icon: <FileText className="w-8 h-8" />,
        color: 'blue',
        fields: ['Student Name', 'Course Name', 'Grade', 'Department', 'Issue Date'],
    },
    {
        id: 'semester-v1',
        name: 'Semester Certificate',
        type: 'SEMESTER',
        description: 'Detailed academic transcript with course-wise grades and SGPA',
        icon: <Award className="w-8 h-8" />,
        color: 'green',
        fields: ['Student Name', 'Registration No', 'Branch', 'Semester', 'Courses', 'SGPA'],
    },
    {
        id: 'achievement-v1',
        name: 'Achievement Certificate',
        type: 'ACHIEVEMENT',
        description: 'Recognition for awards, competitions, and special achievements',
        icon: <Trophy className="w-8 h-8" />,
        color: 'purple',
        fields: ['Student Name', 'Achievement Title', 'Category', 'Date', 'Verifiers'],
    },
    {
        id: 'custom-v1',
        name: 'Custom Certificate',
        type: 'CUSTOM',
        description: 'Flexible template with customizable fields for any purpose',
        icon: <Sparkles className="w-8 h-8" />,
        color: 'orange',
        fields: ['Template ID', 'Custom Fields (Dynamic)'],
    },
];

const CertificateTemplateSelector: React.FC<CertificateTemplateSelectorProps> = ({
    onTemplateSelect,
}) => {
    const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    const getColorClasses = (color: string) => {
        const colors: Record<string, { bg: string; text: string; border: string; hover: string }> = {
            blue: {
                bg: 'bg-blue-100 dark:bg-blue-900/20',
                text: 'text-blue-600 dark:text-blue-400',
                border: 'border-blue-200 dark:border-blue-800',
                hover: 'hover:border-blue-500 dark:hover:border-blue-500',
            },
            green: {
                bg: 'bg-green-100 dark:bg-green-900/20',
                text: 'text-green-600 dark:text-green-400',
                border: 'border-green-200 dark:border-green-800',
                hover: 'hover:border-green-500 dark:hover:border-green-500',
            },
            purple: {
                bg: 'bg-purple-100 dark:bg-purple-900/20',
                text: 'text-purple-600 dark:text-purple-400',
                border: 'border-purple-200 dark:border-purple-800',
                hover: 'hover:border-purple-500 dark:hover:border-purple-500',
            },
            orange: {
                bg: 'bg-orange-100 dark:bg-orange-900/20',
                text: 'text-orange-600 dark:text-orange-400',
                border: 'border-orange-200 dark:border-orange-800',
                hover: 'hover:border-orange-500 dark:hover:border-orange-500',
            },
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Select Certificate Template
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                    Choose a template to start issuing certificates
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {templates.map((template) => {
                    const colors = getColorClasses(template.color);

                    return (
                        <div
                            key={template.id}
                            className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-2 ${colors.border} ${colors.hover} transition-all cursor-pointer group ${selectedTemplate?.id === template.id ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                                }`}
                            onClick={() => setSelectedTemplate(template)}
                        >
                            <div className={`${colors.bg} ${colors.text} p-3 rounded-lg inline-flex mb-4 group-hover:scale-110 transition-transform`}>
                                {template.icon}
                            </div>

                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                {template.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 h-12 overflow-hidden">
                                {template.description}
                            </p>

                            <div className="flex items-center justify-between mt-auto">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors.bg} ${colors.text}`}>
                                    {template.type}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedTemplate(template);
                                        setShowPreview(true);
                                    }}
                                    className={`${colors.text} hover:underline text-sm flex items-center space-x-1`}
                                >
                                    <Eye className="w-4 h-4" />
                                    <span>Preview</span>
                                </button>
                            </div>

                            {selectedTemplate?.id === template.id && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onTemplateSelect(template);
                                    }}
                                    className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 transition"
                                >
                                    <span>Issue</span>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {showPreview && selectedTemplate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {selectedTemplate.name} - Preview
                                </h3>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-12 mb-6 border-4 border-blue-200 dark:border-blue-800">
                                <div className="text-center space-y-4">
                                    <div className={`${getColorClasses(selectedTemplate.color).text} mx-auto inline-block`}>
                                        {React.cloneElement(selectedTemplate.icon as React.ReactElement, {
                                            className: 'w-16 h-16 mx-auto',
                                        })}
                                    </div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                        Certificate of {selectedTemplate.type === 'ACHIEVEMENT' ? 'Achievement' : 'Completion'}
                                    </h2>
                                    <p className="text-lg text-gray-700 dark:text-gray-300">
                                        This is a preview of the {selectedTemplate.name.toLowerCase()}
                                    </p>
                                    <div className="pt-4 space-y-2">
                                        {selectedTemplate.fields.map((field, idx) => (
                                            <div key={idx} className="text-gray-600 dark:text-gray-400">
                                                <span className="font-medium">{field}:</span> [Sample Data]
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => {
                                        setShowPreview(false);
                                        onTemplateSelect(selectedTemplate);
                                    }}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                >
                                    Use This Template
                                </button>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CertificateTemplateSelector;
