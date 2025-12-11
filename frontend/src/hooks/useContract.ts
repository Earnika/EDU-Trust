import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';

// Contract ABIs - Updated for optimized contract
const CERTIFICATE_NFT_ABI = [
  // Core minting functions
  "function mintCertificate(address student, string calldata courseName, string calldata grade, string calldata ipfsHash) external returns (uint256)",
  "function mintCertificatesBatch(address[] calldata students, string[] calldata courseNames, string[] calldata grades, string[] calldata ipfsHashes) external",

  // Semester certificates (simplified params struct)
  "function mintSemesterCertificate(address student, tuple(string serialNo, string memoNo, string regdNo, string branch, string examination, uint256 sgpa) params, string calldata ipfsHash) external returns (uint256)",

  // Achievement certificates
  "function mintAchievementCertificate(address student, string calldata title, string calldata category, string calldata ipfsHash, address[] calldata verifiers) external returns (uint256)",

  // Custom certificates
  "function mintCustomCertificate(address student, string calldata templateId, string[] calldata fieldNames, string[] calldata fieldValues, string calldata ipfsHash) external returns (uint256)",

  // Verification (returns: isValid, ipfsUri, certType)
  "function verifyCertificate(uint256 tokenId) external view returns (bool isValid, string memory ipfsUri, uint8 cType)",
  "function verifyCertificateByVerifier(uint256 tokenId) external returns (bool, uint8)",

  // Admin functions
  "function revokeCertificate(uint256 tokenId) external",
  "function setBaseURI(string memory baseURI) external",
  "function pause() external",
  "function unpause() external",

  // Query functions
  "function getStudentCertificates(address student) external view returns (uint256[])",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string memory)",

  // Role management
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "function grantRole(bytes32 role, address account) external",
  "function MINTER_ROLE() external view returns (bytes32)",
  "function ADMIN_ROLE() external view returns (bytes32)",
  "function VERIFIER_ROLE() external view returns (bytes32)",

  // Constants
  "function MAX_BATCH_SIZE() external view returns (uint256)",

  // Events
  "event CertificateIssued(uint256 indexed tokenId, address indexed student, string ipfsHash, uint8 certType, uint256 timestamp)",
  "event RegularCertDetails(uint256 indexed id, string course, string grade)",
  "event SemesterCertDetails(uint256 indexed id, string serialNo, string memoNo, uint256 sgpa)",
  "event AchievementCertDetails(uint256 indexed id, string title, string category)",
  "event CustomCertDetails(uint256 indexed id, string templateId)",
  "event CertRevoked(uint256 indexed tokenId, address admin)",
  "event CertVerified(uint256 indexed tokenId, address verifier, bool isValid)"
];

const SCHOLARSHIP_ESCROW_ABI = [
  "function createScholarship(string memory name, string memory description, uint256 totalAmount, uint256 maxRecipients, uint256 deadline, address tokenAddress, string memory tokenSymbol, tuple(uint256 minGPA, string[] requiredCourses, string[] allowedDepartments, uint256 minCertificates, uint256 enrollmentAfter, uint256 enrollmentBefore, bool requiresAllCourses) criteria) external payable returns (uint256)",
  "function claimScholarship(uint256 scholarshipId) external",
  "function revokeScholarship(uint256 scholarshipId) external",
  "function isEligibleForScholarship(uint256 scholarshipId, address student) external view returns (bool)",
  "function getStudentScholarships(address student) external view returns (uint256[])",
  "function getScholarship(uint256 scholarshipId) external view returns (tuple(string name, string description, uint256 totalAmount, uint256 claimedAmount, uint256 remainingAmount, uint256 maxRecipients, uint256 amountPerRecipient, uint256 createdAt, uint256 deadline, bool isActive, address createdBy, address tokenAddress, string tokenSymbol))",
  "function getTotalClaimed(address student) external view returns (uint256)",
  "function getContractBalance() external view returns (uint256)",
  "function depositFunds() external payable",
  "function withdrawFunds(uint256 amount) external",
  "function pause() external",
  "function unpause() external",
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "function grantRole(bytes32 role, address account) external",
  "function getRoleAdmin(bytes32 role) external view returns (bytes32)",
  "function DEFAULT_ADMIN_ROLE() external view returns (bytes32)",
  "function SCHOLARSHIP_MANAGER_ROLE() external view returns (bytes32)",
  "function ADMIN_ROLE() external view returns (bytes32)",
  "event ScholarshipCreated(uint256 indexed scholarshipId, string name, uint256 totalAmount, uint256 maxRecipients, uint256 deadline, uint256 timestamp)",
  "event ScholarshipClaimed(uint256 indexed scholarshipId, address indexed student, uint256 amount, uint256 timestamp)",
  "event ScholarshipRevoked(uint256 indexed scholarshipId, address indexed admin, uint256 timestamp)",
  "event FundsDeposited(address indexed depositor, uint256 amount, uint256 timestamp)",
  "event FundsWithdrawn(address indexed admin, uint256 amount, uint256 timestamp)",
  "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)",
  "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)"
];

// Contract addresses
const CONTRACT_ADDRESSES = {
  CertificateNFT: import.meta.env.VITE_CERTIFICATE_NFT_ADDRESS || '',
  ScholarshipEscrow: import.meta.env.VITE_SCHOLARSHIP_ESCROW_ADDRESS || '',
  VignanRegistry: import.meta.env.VITE_VIGNAN_REGISTRY_ADDRESS || ''
};

export interface CertificateData {
  studentName: string;
  courseName: string;
  grade: string;
  ipfsHash: string;
  department: string;
  issueDate: number;
  isRevoked: boolean;
  issuer: string;
}

export interface ScholarshipData {
  name: string;
  description: string;
  totalAmount: string;
  claimedAmount: string;
  remainingAmount: string;
  maxRecipients: number;
  amountPerRecipient: string;
  createdAt: number;
  deadline: number;
  isActive: boolean;
  createdBy: string;
  tokenAddress: string;
  tokenSymbol: string;
}

export const useCIDVerification = () => {
  const { contracts } = useContract();

  const getTokenIdFromCID = async (cid: string): Promise<string | null> => {
    if (!contracts.certificateNFT) return null;

    try {
      const tokenId = await contracts.certificateNFT.getTokenIdByCID(cid);
      return tokenId.toString();
    } catch (err: any) {
      console.error('Error getting token ID from CID:', err);
      return null;
    }
  };

  const getCIDFromTokenId = async (tokenId: string): Promise<string | null> => {
    if (!contracts.certificateNFT) return null;

    try {
      const cid = await contracts.certificateNFT.getCIDByTokenId(tokenId);
      return cid;
    } catch (err: any) {
      console.error('Error getting CID from token ID:', err);
      return null;
    }
  };

  return { getTokenIdFromCID, getCIDFromTokenId };
};

export const useContract = () => {
  const { provider, signer, isConnected } = useWeb3();
  const [contracts, setContracts] = useState<{
    certificateNFT: ethers.Contract | null;
    scholarshipEscrow: ethers.Contract | null;
  }>({
    certificateNFT: null,
    scholarshipEscrow: null
  });

  useEffect(() => {
    if (provider && isConnected) {
      const certificateNFT = new ethers.Contract(
        CONTRACT_ADDRESSES.CertificateNFT,
        CERTIFICATE_NFT_ABI,
        provider
      );

      const scholarshipEscrow = new ethers.Contract(
        CONTRACT_ADDRESSES.ScholarshipEscrow,
        SCHOLARSHIP_ESCROW_ABI,
        provider
      );

      setContracts({
        certificateNFT,
        scholarshipEscrow
      });
    }
  }, [provider, isConnected]);

  const getSignedContracts = () => {
    if (!signer) return null;

    return {
      certificateNFT: contracts.certificateNFT?.connect(signer) as ethers.Contract,
      scholarshipEscrow: contracts.scholarshipEscrow?.connect(signer) as ethers.Contract
    };
  };

  return {
    contracts,
    getSignedContracts,
    isConnected
  };
};

export const useCertificates = (studentAddress: string) => {
  const { contracts } = useContract();
  const [certificates, setCertificates] = useState<Array<CertificateData & { tokenId: string; isValid: boolean }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!contracts.certificateNFT || !studentAddress) return;

      try {
        setLoading(true);
        setError(null);

        const tokenIds = await contracts.certificateNFT.getStudentCertificates(studentAddress);
        const certificateData = await Promise.all(
          tokenIds.map(async (tokenId: bigint) => {
            const [data, isValid] = await contracts.certificateNFT!.verifyCertificate(tokenId);
            return {
              tokenId: tokenId.toString(),
              ...data,
              isValid
            };
          })
        );

        setCertificates(certificateData);
      } catch (err: any) {
        console.error('Error fetching certificates:', err);
        setError('Failed to fetch certificates');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [contracts.certificateNFT, studentAddress]);

  return { certificates, loading, error };
};

export const useScholarships = (studentAddress: string) => {
  const { contracts } = useContract();
  const [scholarships, setScholarships] = useState<Array<ScholarshipData & { id: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScholarships = async () => {
      if (!contracts.scholarshipEscrow || !studentAddress) return;

      try {
        setLoading(true);
        setError(null);

        const scholarshipIds = await contracts.scholarshipEscrow.getStudentScholarships(studentAddress);
        const scholarshipData = await Promise.all(
          scholarshipIds.map(async (scholarshipId: bigint) => {
            const data = await contracts.scholarshipEscrow!.getScholarship(scholarshipId);
            return {
              id: scholarshipId.toString(),
              ...data
            };
          })
        );

        setScholarships(scholarshipData);
      } catch (err: any) {
        console.error('Error fetching scholarships:', err);
        setError('Failed to fetch scholarships');
      } finally {
        setLoading(false);
      }
    };

    fetchScholarships();
  }, [contracts.scholarshipEscrow, studentAddress]);

  return { scholarships, loading, error };
};

export const useCertificateVerification = () => {
  const { contracts } = useContract();
  const [verificationResult, setVerificationResult] = useState<{
    certificateData: CertificateData | null;
    isValid: boolean;
    loading: boolean;
    error: string | null;
  }>({
    certificateData: null,
    isValid: false,
    loading: false,
    error: null
  });

  const verifyCertificate = async (tokenId: string) => {
    if (!contracts.certificateNFT) return;

    try {
      setVerificationResult(prev => ({ ...prev, loading: true, error: null }));

      const [certificateData, isValid] = await contracts.certificateNFT.verifyCertificate(tokenId);

      setVerificationResult({
        certificateData,
        isValid,
        loading: false,
        error: null
      });
    } catch (err: any) {
      console.error('Error verifying certificate:', err);
      setVerificationResult(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to verify certificate'
      }));
    }
  };

  return { verificationResult, verifyCertificate };
};