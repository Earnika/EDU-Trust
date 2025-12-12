import React, { useState, useCallback } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, Loader2, FileText, X } from 'lucide-react';
import { ethers } from 'ethers';
import { useContract } from '../hooks/useContract';
import { useWeb3 } from '../contexts/Web3Context';
import jsPDF from 'jspdf';

interface CertificateRow {
    studentAddress: string;
    studentName: string;
    courseName: string;
    grade: string;
    ipfsHash: string; // Added this as it's needed for minting
    certificateType: 'REGULAR' | 'SEMESTER' | 'ACHIEVEMENT' | 'CUSTOM';
    errors?: string[];
}

interface BulkMintUploaderProps {
    onMintComplete?: (tokenIds: number[]) => void;
}

const BulkMintUploader: React.FC<BulkMintUploaderProps> = ({ onMintComplete }) => {
    const { contracts, getSignedContracts } = useContract();
    const { account } = useWeb3();
    const [file, setFile] = useState<File | null>(null);
    const [data, setData] = useState<CertificateRow[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [isValidating, setIsValidating] = useState(false);
    const [isMinting, setIsMinting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    // Validate Ethereum address
    const isValidAddress = (address: string): boolean => {
        try {
            return ethers.isAddress(address);
        } catch {
            return false;
        }
    };

    // Validate CSV data
    const validateData = (rows: CertificateRow[]): CertificateRow[] => {
        return rows.map((row) => {
            const rowErrors: string[] = [];

            if (!row.studentAddress || !isValidAddress(row.studentAddress)) {
                rowErrors.push('Invalid Ethereum address');
            }
            if (!row.courseName || row.courseName.trim().length === 0) {
                rowErrors.push('Course name required');
            }
            if (!row.grade || row.grade.trim().length === 0) {
                rowErrors.push('Grade required');
            }
            if (!row.ipfsHash || row.ipfsHash.trim().length === 0) {
                // Ideally IPFS hash is generated here or provided.
                // For bulk upload, simplified flow assumes IPFS hash is provided in CSV or generated.
                // Let's require it for now.
                rowErrors.push('IPFS Hash required');
            }

            return {
                ...row,
                errors: rowErrors.length > 0 ? rowErrors : undefined
            };
        });
    };

    // Parse CSV file
    const parseCSV = async (file: File): Promise<CertificateRow[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const text = e.target?.result as string;
                    const lines = text.split('\n').filter(line => line.trim());

                    if (lines.length < 2) {
                        reject(new Error('CSV file must contain header and at least one data row'));
                        return;
                    }

                    const headers = lines[0].split(',').map(h => h.trim());
                    // Standard headers for the contract batch function: student, courseName, grade, ipfsHash
                    // Plus helpful metadata like studentName (stored in IPFS usually, but here we might just log it)
                    const requiredHeaders = ['studentAddress', 'courseName', 'grade', 'ipfsHash'];

                    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
                    if (missingHeaders.length > 0) {
                        reject(new Error(`Missing required headers: ${missingHeaders.join(', ')}`));
                        return;
                    }

                    const rows: CertificateRow[] = lines.slice(1).map((line) => {
                        // Handle CSV parsing better for commas inside quotes if needed
                        // For now, simple split
                        const values = line.split(',').map(v => v.trim());
                        const row: any = {};

                        headers.forEach((header, i) => {
                            row[header] = values[i] || '';
                        });

                        // Set default type if not present
                        if (!row.certificateType) {
                            row.certificateType = 'REGULAR';
                        }

                        return row as CertificateRow;
                    });

                    resolve(rows);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    };

    // Handle file upload
    const handleFileUpload = async (uploadedFile: File) => {
        if (!uploadedFile.name.endsWith('.csv')) {
            setErrors(['Please upload a CSV file']);
            return;
        }

        if (uploadedFile.size > 5 * 1024 * 1024) { // 5MB limit
            setErrors(['File size must be less than 5MB']);
            return;
        }

        setFile(uploadedFile);
        setErrors([]);
        setIsValidating(true);

        try {
            const parsedData = await parseCSV(uploadedFile);

            // Limit batch size (contract limitation)
            // Check contracts.MAX_BATCH_SIZE if available, else assume 50 or 100
            if (parsedData.length > 50) {
                setErrors(['Maximum 50 certificates per batch. Please split into multiple files.']);
                setIsValidating(false);
                return;
            }

            const validatedData = validateData(parsedData);
            setData(validatedData);

            const globalErrors = validatedData
                .filter(row => row.errors && row.errors.length > 0)
                .map((row, idx) => `Row ${idx + 1}: ${row.errors?.join(', ')}`)
                .slice(0, 10); // Show first 10 errors

            if (globalErrors.length > 0) {
                setErrors(globalErrors);
            }
        } catch (error: any) {
            setErrors([error.message || 'Failed to parse CSV file']);
        } finally {
            setIsValidating(false);
        }
    };

    // Drag and drop handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileUpload(droppedFile);
        }
    }, []);

    // Download CSV template
    const downloadTemplate = () => {
        const template = `studentAddress,studentName,courseName,grade,ipfsHash,certificateType
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1,John Doe,Computer Science Fundamentals,A+,QmHash123,REGULAR
0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199,Jane Smith,Data Structures,A,QmHash456,REGULAR`;

        const blob = new Blob([template], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bulk_mint_template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    // Mint certificates in batches
    const handleMint = async () => {
        const validRows = data.filter(row => !row.errors || row.errors.length === 0);

        if (validRows.length === 0) {
            setErrors(['No valid rows to mint']);
            return;
        }

        const signedContracts = getSignedContracts();
        if (!signedContracts?.certificateNFT || !account) {
            setErrors(['Wallet not connected or contract not available']);
            return;
        }

        setIsMinting(true);
        setProgress(0);

        try {
            // Prepare data arrays
            const students = validRows.map(r => r.studentAddress);
            const courseNames = validRows.map(r => r.courseName);
            const grades = validRows.map(r => r.grade);
            const ipfsHashes = validRows.map(r => r.ipfsHash);

            // Batch processing if needed (though we limited file size to 50)
            // If we limited file to 50 and contract max is 50, we can send one tx.
            // Or split if we want safe limits. Let's send one tx for now if under 50.

            console.log('Minting batch of', students.length, 'certificates');

            const tx = await signedContracts.certificateNFT.mintCertificatesBatch(
                students,
                courseNames,
                grades,
                ipfsHashes
            );

            console.log('Transaction sent:', tx.hash);
            const receipt = await tx.wait();
            console.log('Transaction confirmed:', receipt.hash);

            // Extract token IDs from events
            const tokenIds: string[] = [];
            try {
                for (const log of receipt.logs) {
                    try {
                        const parsed = signedContracts.certificateNFT.interface.parseLog(log);
                        if (parsed?.name === 'CertificateIssued') {
                            tokenIds.push(parsed.args.tokenId.toString());
                        }
                    } catch {
                        // Skip logs that don't match
                    }
                }
            } catch (error) {
                console.warn('Could not extract token IDs from receipt');
            }

            console.log('Minted token IDs:', tokenIds);

            // Generate PDFs for each certificate
            if (tokenIds.length > 0) {
                console.log('Generating PDFs for', tokenIds.length, 'certificates...');
                for (let i = 0; i < validRows.length && i < tokenIds.length; i++) {
                    const row = validRows[i];
                    const tokenId = tokenIds[i];

                    // Generate PDF for this certificate
                    const doc = new jsPDF({
                        orientation: 'landscape',
                        unit: 'mm',
                        format: 'a4'
                    });

                    const pageWidth = doc.internal.pageSize.getWidth();
                    const pageHeight = doc.internal.pageSize.getHeight();

                    // Background
                    doc.setFillColor(59, 130, 246); // Blue
                    doc.rect(0, 0, pageWidth, 15, 'F');
                    doc.setFillColor(249, 250, 251);
                    doc.rect(0, 15, pageWidth, pageHeight - 30, 'F');
                    doc.setFillColor(59, 130, 246);
                    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');

                    // Border
                    doc.setDrawColor(59, 130, 246);
                    doc.setLineWidth(2);
                    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
                    doc.setLineWidth(0.5);
                    doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

                    // Title
                    doc.setFontSize(36);
                    doc.setTextColor(59, 130, 246);
                    doc.setFont('helvetica', 'bold');
                    doc.text('CERTIFICATE OF COMPLETION', pageWidth / 2, 40, { align: 'center' });

                    // Decorative line
                    doc.setDrawColor(59, 130, 246);
                    doc.setLineWidth(1);
                    doc.line(60, 45, pageWidth - 60, 45);

                    // "This is to certify that"
                    doc.setFontSize(14);
                    doc.setTextColor(75, 85, 99);
                    doc.setFont('helvetica', 'normal');
                    doc.text('This is to certify that', pageWidth / 2, 65, { align: 'center' });

                    // Student name
                    doc.setFontSize(28);
                    doc.setTextColor(31, 41, 55);
                    doc.setFont('helvetica', 'bold');
                    doc.text(row.studentName || 'Student', pageWidth / 2, 80, { align: 'center' });

                    // Underline
                    doc.setDrawColor(59, 130, 246);
                    doc.setLineWidth(0.5);
                    doc.line(pageWidth / 2 - 60, 82, pageWidth / 2 + 60, 82);

                    // Course text
                    doc.setFontSize(14);
                    doc.setTextColor(75, 85, 99);
                    doc.setFont('helvetica', 'normal');
                    doc.text('has successfully completed the course', pageWidth / 2, 95, { align: 'center' });

                    // Course name
                    doc.setFontSize(20);
                    doc.setTextColor(59, 130, 246);
                    doc.setFont('helvetica', 'bold');
                    doc.text(row.courseName, pageWidth / 2, 110, { align: 'center' });

                    // Grade
                    doc.setFontSize(16);
                    doc.setTextColor(31, 41, 55);
                    doc.setFont('helvetica', 'normal');
                    doc.text(`Grade: ${row.grade}`, pageWidth / 2, 125, { align: 'center' });

                    // Date
                    doc.setFontSize(12);
                    doc.setTextColor(75, 85, 99);
                    const dateText = new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    doc.text(`Date: ${dateText}`, 40, pageHeight - 40);

                    // Signature line
                    doc.setLineWidth(0.5);
                    doc.setDrawColor(107, 114, 128);
                    doc.line(pageWidth - 100, pageHeight - 45, pageWidth - 30, pageHeight - 45);
                    doc.setFontSize(10);
                    doc.setTextColor(107, 114, 128);
                    doc.text('Authorized Signatory', pageWidth - 65, pageHeight - 38, { align: 'center' });

                    // Token ID
                    doc.setFontSize(8);
                    doc.setTextColor(156, 163, 175);
                    doc.text(`Token ID: ${tokenId}`, pageWidth - 30, pageHeight - 25, { align: 'right' });

                    // Blockchain verified badge
                    doc.setFillColor(16, 185, 129);
                    doc.circle(30, pageHeight - 30, 8, 'F');
                    doc.setFontSize(8);
                    doc.setTextColor(255, 255, 255);
                    doc.text('✓', 30, pageHeight - 28, { align: 'center' });
                    doc.setFontSize(9);
                    doc.setTextColor(16, 185, 129);
                    doc.text('Blockchain Verified', 42, pageHeight - 28);

                    // Download PDF
                    const pdfBlob = doc.output('blob');
                    const url = URL.createObjectURL(pdfBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `certificate-${tokenId}-${row.studentName.replace(/\s+/g, '-')}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);

                    // Small delay between downloads to avoid browser blocking
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                console.log('✅ All PDFs generated and downloaded!');
            }

            if (onMintComplete) {
                onMintComplete(tokenIds.map(id => parseInt(id)));
            }

            // Reset form
            setFile(null);
            setData([]);
            setErrors([]);
            alert(`Batch minting successful! ${tokenIds.length} certificates minted and PDFs downloaded.`);

        } catch (error: any) {
            console.error('Batch minting error:', error);
            setErrors([error.reason || error.message || 'Failed to mint certificates']);
        } finally {
            setIsMinting(false);
            setProgress(0);
        }
    };

    const validRowCount = data.filter(row => !row.errors || row.errors.length === 0).length;
    const hasErrors = data.some(row => row.errors && row.errors.length > 0);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Bulk Certificate Minting
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                    Upload a CSV file to mint multiple certificates at once (max 50 per batch)
                </p>
            </div>

            <button
                onClick={downloadTemplate}
                className="mb-4 inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
                <Download className="w-4 h-4" />
                <span>Download CSV Template</span>
            </button>

            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                    }`}
            >
                <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                    id="csv-upload"
                />

                <label htmlFor="csv-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {file ? file.name : 'Drag and drop your CSV file here, or click to browse'}
                    </p>
                    <p className="text-sm text-gray-500">
                        Maximum file size: 5MB | Maximum rows: 50
                    </p>
                </label>
            </div>

            {isValidating && (
                <div className="mt-4 flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Validating data...</span>
                </div>
            )}

            {errors.length > 0 && (
                <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-medium text-red-900 dark:text-red-200 mb-2">
                                Validation Errors
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
                                {errors.map((error, idx) => (
                                    <li key={idx}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {data.length > 0 && (
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                            Preview ({validRowCount} valid / {data.length} total)
                        </h4>
                        <button
                            onClick={() => {
                                setFile(null);
                                setData([]);
                                setErrors([]);
                            }}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="overflow-x-auto max-h-60 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left">#</th>
                                    <th className="px-4 py-2 text-left">Address</th>
                                    <th className="px-4 py-2 text-left">Course</th>
                                    <th className="px-4 py-2 text-left">Grade</th>
                                    <th className="px-4 py-2 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {data.map((row, idx) => (
                                    <tr
                                        key={idx}
                                        className={row.errors ? 'bg-red-50 dark:bg-red-900/10' : ''}
                                    >
                                        <td className="px-4 py-2">{idx + 1}</td>
                                        <td className="px-4 py-2 font-mono text-xs">
                                            {row.studentAddress.slice(0, 10)}...
                                        </td>
                                        <td className="px-4 py-2">{row.courseName}</td>
                                        <td className="px-4 py-2">{row.grade}</td>
                                        <td className="px-4 py-2">
                                            {row.errors ? (
                                                <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                                                    <AlertCircle className="w-4 h-4" />
                                                    <span className="text-xs">{row.errors.length} errors</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span className="text-xs">Valid</span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            <FileText className="w-4 h-4 inline mr-1" />
                            Estimated gas: ~{(validRowCount * 80000).toLocaleString()} gas
                        </div>
                        <button
                            onClick={handleMint}
                            disabled={hasErrors || validRowCount === 0 || isMinting}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            {isMinting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Minting...</span>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    <span>Mint {validRowCount} Certificates</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulkMintUploader;
