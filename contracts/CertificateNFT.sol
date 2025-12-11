// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title CertificateNFT (Optimized)
 * @dev High-efficiency NFT contract for Vignan Institute.
 * Uses event logging for data persistence instead of expensive storage.
 */
contract CertificateNFT is ERC721URIStorage, AccessControl, Pausable {
    using Strings for uint256;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    enum CertificateType { REGULAR, SEMESTER, ACHIEVEMENT, CUSTOM }

    // Optimization constants
    uint256 public constant MAX_BATCH_SIZE = 50;

    // Custom Errors
    error InvalidInput(); 
    error Unauthorized();
    error NotFound();
    error AlreadyExists();
    error Revoked();
    error BatchLimit();
    error LengthMismatch();

    // Minimal State
    uint256 private _tokenIdCounter;
    string private _baseTokenURI;
    
    // Mapping from token ID to minimal metadata
    mapping(uint256 => CertificateConfig) public certConfigs;
    // Mapping from student to list of their token IDs
    mapping(address => uint256[]) public studentCertificates;
    // Prevent duplicates
    mapping(string => bool) public usedHashes;
    mapping(string => bool) public usedUniqueIdentifiers; // SerialNos, MemoNos merged map

    struct CertificateConfig {
        CertificateType certType;
        bool isRevoked;
        address issuer;
        uint256 issueDate;
    }

    // Events - These serve as the permanent record of data
    event CertificateIssued(
        uint256 indexed tokenId,
        address indexed student,
        string ipfsHash,
        CertificateType certType,
        uint256 timestamp
    );
    
    // Detailed log events for indexing (gas cheaper than storage)
    event RegularCertDetails(uint256 indexed id, string course, string grade);
    event SemesterCertDetails(uint256 indexed id, string serialNo, string memoNo, uint256 sgpa);
    event AchievementCertDetails(uint256 indexed id, string title, string category);
    event CustomCertDetails(uint256 indexed id, string templateId);
    
    event CertRevoked(uint256 indexed tokenId, address admin);
    event CertVerified(uint256 indexed tokenId, address verifier, bool isValid);

    struct SemesterParams {
        string serialNo;
        string memoNo;
        string regdNo;
        string branch;
        string examination;
        uint256 sgpa; // Pre-calculated
    }

    constructor() ERC721("Vignan Certificate", "VIGNAN") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    // --- Core Internal Logic ---

    function _mintBase(address to, string calldata ipfsHash, CertificateType cType) internal returns (uint256) {
        if (to == address(0)) revert InvalidInput();
        if (bytes(ipfsHash).length == 0) revert InvalidInput();
        if (usedHashes[ipfsHash]) revert AlreadyExists();

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, ipfsHash); // In URIStorage, this sets the full string usually. 
        // If we want to use baseURI + ID, we would just store the hash. 
        // For compatibility with previous logic:
        // We will store just the ipfsHash in the map if needed, but URIStorage stores string.
        
        certConfigs[tokenId] = CertificateConfig({
            certType: cType,
            isRevoked: false,
            issuer: msg.sender,
            issueDate: block.timestamp
        });

        studentCertificates[to].push(tokenId);
        usedHashes[ipfsHash] = true;

        emit CertificateIssued(tokenId, to, ipfsHash, cType, block.timestamp);
        return tokenId;
    }

    // --- Public Minting Functions ---

    /**
     * @dev Batch mint regular certificates. 
     * Note: Arrays must be equal length.
     */
    function mintCertificatesBatch(
        address[] calldata students,
        string[] calldata courseNames,
        string[] calldata grades,
        string[] calldata ipfsHashes
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        uint256 len = students.length;
        if (len > MAX_BATCH_SIZE) revert BatchLimit();
        if (courseNames.length != len || grades.length != len || ipfsHashes.length != len) revert LengthMismatch();

        for (uint256 i = 0; i < len; i++) {
            uint256 tid = _mintBase(students[i], ipfsHashes[i], CertificateType.REGULAR);
            emit RegularCertDetails(tid, courseNames[i], grades[i]);
        }
    }

    /**
     * @dev Mint single regular certificate (Legacy support wrapper)
     */
    function mintCertificate(
        address student,
        string calldata courseName,
        string calldata grade,
        string calldata ipfsHash
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        uint256 tid = _mintBase(student, ipfsHash, CertificateType.REGULAR);
        emit RegularCertDetails(tid, courseName, grade);
        return tid;
    }

    /**
     * @dev Mint semester certificate.
     * simplified to avoid stack too deep.
     */
    function mintSemesterCertificate(
        address student,
        SemesterParams calldata params,
        string calldata ipfsHash
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        if (usedUniqueIdentifiers[params.serialNo] || usedUniqueIdentifiers[params.memoNo]) revert AlreadyExists();
        
        uint256 tid = _mintBase(student, ipfsHash, CertificateType.SEMESTER);
        
        usedUniqueIdentifiers[params.serialNo] = true;
        usedUniqueIdentifiers[params.memoNo] = true;

        emit SemesterCertDetails(tid, params.serialNo, params.memoNo, params.sgpa);
        return tid;
    }

    /**
     * @dev Mint achievement certificate
     */
    function mintAchievementCertificate(
        address student,
        string calldata title,
        string calldata category,
        string calldata ipfsHash,
        address[] calldata /* verifiers */ // kept for API compat, but unused on-chain
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        uint256 tid = _mintBase(student, ipfsHash, CertificateType.ACHIEVEMENT);
        emit AchievementCertDetails(tid, title, category);
        return tid;
    }

    /**
     * @dev Mint custom certificate
     */
    function mintCustomCertificate(
        address student,
        string calldata templateId,
        string[] calldata /* fieldNames */, // Data should be in IPFS
        string[] calldata /* fieldValues */,
        string calldata ipfsHash
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        uint256 tid = _mintBase(student, ipfsHash, CertificateType.CUSTOM);
        emit CustomCertDetails(tid, templateId);
        return tid;
    }

    // --- Admin & Verification ---

    function revokeCertificate(uint256 tokenId) external onlyRole(ADMIN_ROLE) {
        if (_ownerOf(tokenId) == address(0)) revert NotFound();
        if (certConfigs[tokenId].isRevoked) revert Revoked();
        
        certConfigs[tokenId].isRevoked = true;
        emit CertRevoked(tokenId, msg.sender);
    }

    function verifyCertificate(uint256 tokenId) external view returns (bool isValid, string memory ipfsUri, CertificateType cType) {
        if (_ownerOf(tokenId) == address(0)) return (false, "", CertificateType.REGULAR);
        
        CertificateConfig memory conf = certConfigs[tokenId];
        if (conf.isRevoked) return (false, "", conf.certType);

        return (true, tokenURI(tokenId), conf.certType);
    }
    
    // Verifier role action
    function verifyCertificateByVerifier(uint256 tokenId) external onlyRole(VERIFIER_ROLE) returns (bool, CertificateType) {
         (bool valid, , CertificateType cType) = this.verifyCertificate(tokenId);
         emit CertVerified(tokenId, msg.sender, valid);
         return (valid, cType);
    }

    function getStudentCertificates(address student) external view returns (uint256[] memory) {
        return studentCertificates[student];
    }

    // Minimal Utils
    function setBaseURI(string memory baseURI) external onlyRole(ADMIN_ROLE) {
        _baseTokenURI = baseURI;
    }
    
    function pause() external onlyRole(ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(ADMIN_ROLE) { _unpause(); }
    
    // Overrides
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
