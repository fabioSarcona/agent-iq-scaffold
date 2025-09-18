import { useMemo } from 'react';

// Admin emails - can be configured via environment variables
const ADMIN_EMAILS = [
  'admin@needagent.com',
  'support@needagent.com',
  'dev@needagent.com'
];

// Admin domains - users with emails from these domains are admins
const ADMIN_DOMAINS = [
  'needagent.com'
];

interface AdminConfig {
  isAdmin: boolean;
  canAccessDevConsole: boolean;
  canViewSystemLogs: boolean;
  canManageBilling: boolean;
}

/**
 * Simple admin system based on email patterns
 * In production this would be replaced with proper role-based access control
 */
export function useAdmin(userEmail?: string): AdminConfig {
  return useMemo(() => {
    // If no email provided, not an admin
    if (!userEmail) {
      return {
        isAdmin: false,
        canAccessDevConsole: false,
        canViewSystemLogs: false,
        canManageBilling: false
      };
    }

    const email = userEmail.toLowerCase().trim();
    
    // Check if email is in admin list
    const isAdminEmail = ADMIN_EMAILS.includes(email);
    
    // Check if email domain is in admin domains
    const emailDomain = email.split('@')[1];
    const isAdminDomain = emailDomain && ADMIN_DOMAINS.includes(emailDomain);
    
    const isAdmin = isAdminEmail || isAdminDomain;

    return {
      isAdmin,
      canAccessDevConsole: isAdmin,
      canViewSystemLogs: isAdmin,
      canManageBilling: isAdmin
    };
  }, [userEmail]);
}

/**
 * Hook for development environment admin access
 * In development, everyone is an admin for easier testing
 */
export function useDevAdmin(): AdminConfig {
  const isDev = process.env.NODE_ENV !== 'production';
  
  return useMemo(() => ({
    isAdmin: isDev,
    canAccessDevConsole: isDev,
    canViewSystemLogs: isDev,
    canManageBilling: isDev
  }), [isDev]);
}