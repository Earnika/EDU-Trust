import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRoleAccess } from '../hooks/useRoleAccess';

interface ProtectedRouteProps {
    role: 'ADMIN' | 'MINTER' | 'VERIFIER' | 'STUDENT';
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ role, children }) => {
    const { roles, isLoading } = useRoleAccess();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    let hasAccess = false;

    switch (role) {
        case 'ADMIN':
            hasAccess = roles.isAdmin;
            break;
        case 'MINTER':
            hasAccess = roles.isMinter || roles.isAdmin; // Admins usually have minter access or can grant it to themselves
            break;
        case 'VERIFIER':
            hasAccess = roles.isVerifier || roles.isAdmin;
            break;
        case 'STUDENT':
            hasAccess = roles.isStudent || roles.isAdmin || roles.isMinter || roles.isVerifier;
            break;
        default:
            hasAccess = false;
    }

    if (!hasAccess) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
