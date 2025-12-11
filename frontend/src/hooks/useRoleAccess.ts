import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import CertificateNFTArtifact from '../../../artifacts/contracts/CertificateNFT.sol/CertificateNFT.json';

// Get contract address from environment or variable (assuming it's in .env or a config)
// For now, we'll try to get it from the Web3Context or environment
const CERTIFICATE_NFT_ADDRESS = import.meta.env.VITE_CERTIFICATE_NFT_ADDRESS;

interface UserRoles {
    isAdmin: boolean;
    isMinter: boolean;
    isVerifier: boolean;
    isStudent: boolean;
    isLoading: boolean;
}

interface RoleAccessHook {
    roles: UserRoles;
    checkRole: (role: string) => Promise<boolean>;
    hasAnyRole: (requiredRoles: string[]) => boolean;
    refreshRoles: () => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

// Role constants matching the smart contract
export const ROLES = {
    DEFAULT_ADMIN: ethers.id('DEFAULT_ADMIN_ROLE'), // Keccak256 hash or provided by AccessControl
    ADMIN: ethers.id('ADMIN_ROLE'),
    MINTER: ethers.id('MINTER_ROLE'),
    VERIFIER: ethers.id('VERIFIER_ROLE'),
} as const;

/**
 * Hook for managing role-based access control
 * Checks user roles from the CertificateNFT smart contract
 */
export const useRoleAccess = (): RoleAccessHook => {
    const { account, signer, isConnected } = useWeb3();

    const [roles, setRoles] = useState<UserRoles>({
        isAdmin: false,
        isMinter: false,
        isVerifier: false,
        isStudent: true, // Everyone is a student by default
        isLoading: true,
    });

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Get contract instance
     */
    const getContract = useCallback(async () => {
        if (!signer) return null;

        if (!CERTIFICATE_NFT_ADDRESS) {
            console.warn('Contract address not configured');
            return null;
        }

        // ABI for role checking functions
        // We can use the full ABI or a partial one
        const abi = [
            'function hasRole(bytes32 role, address account) view returns (bool)',
            'function ADMIN_ROLE() view returns (bytes32)',
            'function MINTER_ROLE() view returns (bytes32)',
            'function VERIFIER_ROLE() view returns (bytes32)',
            'function DEFAULT_ADMIN_ROLE() view returns (bytes32)',
        ];

        return new ethers.Contract(CERTIFICATE_NFT_ADDRESS, abi, signer);
    }, [signer]);

    /**
     * Check if user has a specific role
     */
    const checkRole = useCallback(async (roleHash: string): Promise<boolean> => {
        if (!account || !signer) return false;

        try {
            const contract = await getContract();
            if (!contract) return false;

            const hasRole = await contract.hasRole(roleHash, account);
            return hasRole;
        } catch (err) {
            console.error('Error checking role:', err);
            return false;
        }
    }, [account, signer, getContract]);

    /**
     * Check if user has any of the required roles
     */
    const hasAnyRole = useCallback((requiredRoles: string[]): boolean => {
        if (requiredRoles.includes('ADMIN') && roles.isAdmin) return true;
        if (requiredRoles.includes('MINTER') && roles.isMinter) return true;
        if (requiredRoles.includes('VERIFIER') && roles.isVerifier) return true;
        if (requiredRoles.includes('STUDENT') && roles.isStudent) return true;
        return false;
    }, [roles]);

    /**
     * Refresh all roles for the current user
     */
    const refreshRoles = useCallback(async () => {
        if (!account || !signer || !isConnected) {
            setRoles({
                isAdmin: false,
                isMinter: false,
                isVerifier: false,
                isStudent: true,
                isLoading: false,
            });
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const contract = await getContract();
            if (!contract) {
                // If contract not ready, just set default
                setRoles(prev => ({ ...prev, isLoading: false }));
                setIsLoading(false);
                return;
            }

            // Default hashes if contract call fails or optimizations
            // Note: In standard OpenZeppelin, these are constants, but good to fetch to be sure if changed
            // However, fetching constants might be overkill if we know them.
            // Let's rely on constants defined in JS for speed if possible, or fetch once.
            // For robustness, let's fetch.

            const adminRoleHash = await contract.ADMIN_ROLE().catch(() => ethers.id("ADMIN_ROLE"));
            const minterRoleHash = await contract.MINTER_ROLE().catch(() => ethers.id("MINTER_ROLE"));
            const verifierRoleHash = await contract.VERIFIER_ROLE().catch(() => ethers.id("VERIFIER_ROLE"));
            const defaultAdminHash = await contract.DEFAULT_ADMIN_ROLE().catch(() => ethers.ZeroHash); // DEFAULT_ADMIN_ROLE is 0x00..00

            // Check all roles in parallel
            const [isAdmin, isMinter, isVerifier, isDefaultAdmin] = await Promise.all([
                contract.hasRole(adminRoleHash, account),
                contract.hasRole(minterRoleHash, account),
                contract.hasRole(verifierRoleHash, account),
                contract.hasRole(defaultAdminHash, account),
            ]);

            setRoles({
                isAdmin: isAdmin || isDefaultAdmin,
                isMinter: isMinter,
                isVerifier: isVerifier,
                isStudent: true, // Everyone can be a student
                isLoading: false,
            });
        } catch (err: any) {
            console.error('Error fetching roles:', err);
            setError(err.message || 'Failed to fetch user roles');
            setRoles(prev => ({ ...prev, isLoading: false }));
        } finally {
            setIsLoading(false);
        }
    }, [account, signer, isConnected, getContract]);

    // Fetch roles when account changes
    useEffect(() => {
        refreshRoles();
    }, [refreshRoles]);

    return {
        roles,
        checkRole,
        hasAnyRole,
        refreshRoles,
        isLoading,
        error,
    };
};

export default useRoleAccess;
