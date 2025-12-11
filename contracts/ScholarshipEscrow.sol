// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CertificateNFT.sol";

/**
 * @title ScholarshipEscrow
 * @dev Smart contract for managing scholarship funds and disbursements
 * @author Vignan Institute
 */
contract ScholarshipEscrow is AccessControl, Pausable, ReentrancyGuard {
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant SCHOLARSHIP_MANAGER_ROLE = keccak256("SCHOLARSHIP_MANAGER_ROLE");
    
    // State variables
    uint256 private _scholarshipIdCounter;
    mapping(uint256 => Scholarship) public scholarships;
    mapping(address => uint256[]) public studentScholarships;
    mapping(address => uint256) public totalClaimed;
    mapping(uint256 => mapping(address => bool)) public scholarshipClaims; // scholarshipId => student => claimed
    mapping(uint256 => EligibilityCriteria) public scholarshipCriteria;
    
    // Certificate NFT contract
    CertificateNFT public certificateNFT;
    
    // Events
    event ScholarshipCreated(
        uint256 indexed scholarshipId,
        string name,
        uint256 totalAmount,
        uint256 maxRecipients,
        uint256 deadline,
        uint256 timestamp
    );
    
    event ScholarshipClaimed(
        uint256 indexed scholarshipId,
        address indexed student,
        uint256 amount,
        uint256 timestamp
    );
    
    event ScholarshipRevoked(uint256 indexed scholarshipId, address indexed admin, uint256 timestamp);
    
    event FundsDeposited(address indexed depositor, uint256 amount, uint256 timestamp);
    event FundsWithdrawn(address indexed admin, uint256 amount, uint256 timestamp);
    
    // Structs
    struct Scholarship {
        string name;
        string description;
        uint256 totalAmount;
        uint256 claimedAmount;
        uint256 remainingAmount;
        uint256 maxRecipients;
        uint256 amountPerRecipient;
        uint256 createdAt;
        uint256 deadline;
        bool isActive;
        address createdBy;
        address tokenAddress; // 0x0 for ETH, contract address for ERC20
        string tokenSymbol;
    }

    struct EligibilityCriteria {
        uint256 minGPA; // GPA * 100 (e.g., 350 for 3.5 GPA)
        string[] requiredCourses;
        string[] allowedDepartments;
        uint256 minCertificates;
        uint256 enrollmentAfter; // timestamp
        uint256 enrollmentBefore; // timestamp
        bool requiresAllCourses; // true = AND, false = OR
    }
    
    constructor(address _certificateNFT) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(SCHOLARSHIP_MANAGER_ROLE, msg.sender);
        
        certificateNFT = CertificateNFT(_certificateNFT);
    }
    
    /**
     * @dev Create a new scholarship with eligibility criteria
     */
    function createScholarship(
        string memory name,
        string memory description,
        uint256 totalAmount,
        uint256 maxRecipients,
        uint256 deadline,
        address tokenAddress,
        string memory tokenSymbol,
        EligibilityCriteria memory criteria
    ) external payable onlyRole(SCHOLARSHIP_MANAGER_ROLE) whenNotPaused returns (uint256) {
        require(totalAmount > 0, "Amount must be greater than 0");
        require(maxRecipients > 0, "Max recipients must be greater than 0");
        require(deadline > block.timestamp, "Deadline must be in the future");
        require(bytes(name).length > 0, "Name cannot be empty");
        
        // For ETH scholarships, check msg.value
        if (tokenAddress == address(0)) {
            require(msg.value >= totalAmount, "Insufficient ETH sent");
        }
        
        _scholarshipIdCounter++;
        uint256 scholarshipId = _scholarshipIdCounter;
        
        uint256 amountPerRecipient = totalAmount / maxRecipients;
        
        scholarships[scholarshipId] = Scholarship({
            name: name,
            description: description,
            totalAmount: totalAmount,
            claimedAmount: 0,
            remainingAmount: totalAmount,
            maxRecipients: maxRecipients,
            amountPerRecipient: amountPerRecipient,
            createdAt: block.timestamp,
            deadline: deadline,
            isActive: true,
            createdBy: msg.sender,
            tokenAddress: tokenAddress,
            tokenSymbol: tokenSymbol
        });
        
        scholarshipCriteria[scholarshipId] = criteria;
        
        emit ScholarshipCreated(scholarshipId, name, totalAmount, maxRecipients, deadline, block.timestamp);
        
        return scholarshipId;
    }
    
    /**
     * @dev Claim scholarship funds (students only)
     */
    function claimScholarship(uint256 scholarshipId) external whenNotPaused nonReentrant {
        Scholarship storage scholarship = scholarships[scholarshipId];
        
        require(scholarship.isActive, "Scholarship is not active");
        require(block.timestamp <= scholarship.deadline, "Scholarship deadline has passed");
        require(!scholarshipClaims[scholarshipId][msg.sender], "Already claimed this scholarship");
        require(scholarship.remainingAmount > 0, "No funds remaining");
        require(scholarship.claimedAmount < scholarship.totalAmount, "Scholarship fully claimed");
        
        // Check eligibility
        require(isEligibleForScholarship(scholarshipId, msg.sender), "Student not eligible for this scholarship");
        
        uint256 claimAmount = scholarship.amountPerRecipient;
        require(claimAmount <= scholarship.remainingAmount, "Insufficient funds for claim");
        
        // Mark as claimed
        scholarshipClaims[scholarshipId][msg.sender] = true;
        
        // Update scholarship data
        scholarship.claimedAmount += claimAmount;
        scholarship.remainingAmount -= claimAmount;
        
        // Mark as inactive if fully claimed
        if (scholarship.remainingAmount == 0 || scholarship.claimedAmount >= scholarship.totalAmount) {
            scholarship.isActive = false;
        }
        
        // Transfer funds
        if (scholarship.tokenAddress == address(0)) {
            // ETH transfer
            require(address(this).balance >= claimAmount, "Insufficient contract balance");
            (bool success, ) = payable(msg.sender).call{value: claimAmount}("");
            require(success, "ETH transfer failed");
        } else {
            // ERC20 transfer (to be implemented with IERC20 interface)
            revert("ERC20 transfers not yet implemented");
        }
        
        totalClaimed[msg.sender] += claimAmount;
        studentScholarships[msg.sender].push(scholarshipId);
        
        emit ScholarshipClaimed(scholarshipId, msg.sender, claimAmount, block.timestamp);
    }
    
    /**
     * @dev Check if student is eligible for a specific scholarship (Simplified)
     */
    function isEligibleForScholarship(uint256 scholarshipId, address student) public view returns (bool) {
        EligibilityCriteria memory criteria = scholarshipCriteria[scholarshipId];
        
        // Get student's certificates
        uint256[] memory studentCerts = certificateNFT.getStudentCertificates(student);
        
        // Check minimum certificates requirement
        if (studentCerts.length < criteria.minCertificates) {
            return false;
        }
        
        // Note: Advanced course/department checking removed as data is now Off-Chain/Encoded.
        // For production, this logic needs to verify via Oracle or signed claims, 
        // or check simple metadata (CertificateType) which IS available.
        // For now, we assume simple eligibility based on holding certificates.
        
        return true;
    }
    
    /**
     * @dev Check if student has required courses (Verified off-chain for now)
     */
    function hasRequiredCertificates(address student) public view returns (bool) {
         uint256[] memory studentCerts = certificateNFT.getStudentCertificates(student);
         return studentCerts.length > 0;
    }

    /**
     * @dev Revoke a scholarship
     */
    function revokeScholarship(uint256 scholarshipId) external onlyRole(ADMIN_ROLE) {
        Scholarship storage scholarship = scholarships[scholarshipId];
        
        require(scholarship.isActive, "Scholarship is not active");
        
        scholarship.isActive = false;
        
        emit ScholarshipRevoked(scholarshipId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Deposit funds to the escrow
     */
    function depositFunds() external payable whenNotPaused {
        require(msg.value > 0, "Amount must be greater than 0");
        emit FundsDeposited(msg.sender, msg.value, block.timestamp);
    }
    
    /**
     * @dev Withdraw funds from the escrow (admin only)
     */
    function withdrawFunds(uint256 amount) external onlyRole(ADMIN_ROLE) nonReentrant {
        require(amount <= address(this).balance, "Insufficient balance");
        require(amount > 0, "Amount must be greater than 0");
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit FundsWithdrawn(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @dev Get scholarship details
     */
    function getScholarship(uint256 scholarshipId) external view returns (Scholarship memory) {
        return scholarships[scholarshipId];
    }
    
    /**
     * @dev Get all scholarships for a student
     */
    function getStudentScholarships(address student) external view returns (uint256[] memory) {
        return studentScholarships[student];
    }
    
    /**
     * @dev Get total claimed amount for a student
     */
    function getTotalClaimed(address student) external view returns (uint256) {
        return totalClaimed[student];
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value, block.timestamp);
    }
}
