"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authClient } from "@/lib/auth-client";

interface ApiKey {
    id: string;
    userId: string;
    key: string;
}

interface Session {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    user: {
        id: string;
        email: string;
    };
}

interface User {
    id: string;
    email: string;
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    isLoading: boolean;
    updateSessionAndUser: () => Promise<void>;
    apiKeys: ApiKey[];
    createApiKey: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    isLoading: true,
    updateSessionAndUser: async () => { },
    apiKeys: [],
    createApiKey: async () => { }
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);

    const fetchApiKeys = async () => {
        try {
            const response = await fetch('/api/keys', {
                credentials: 'include'
            });
            if (response.ok) {
                const keys = await response.json();
                setApiKeys(keys);
            }
        } catch (error) {
            console.error('Failed to fetch API keys:', error);
        }
    };

    const createApiKey = async () => {
        try {
            const response = await fetch('/api/keys', {
                method: 'POST',
                credentials: 'include'
            });
            if (response.ok) {
                fetchApiKeys();
            }
        } catch (error) {
            console.error('Failed to create API key:', error);
        }
    };

    const updateSessionAndUser = useCallback(async () => {
        const { data } = await authClient.getSession();
        if (data?.session) {
            // Ensure session has user property before setting
            const sessionWithUser: Session = {
                ...data.session,
                user: data.user
            };
            setSession(sessionWithUser);
            setUser(data.user);
            fetchApiKeys();
        } else {
            setSession(null);
            setUser(null);
        }
    }, []);

    useEffect(() => {
        updateSessionAndUser().finally(() => setIsLoading(false));
    }, [updateSessionAndUser]);

    return (
        <AuthContext.Provider
            value={{
                session,
                user,
                isLoading,
                updateSessionAndUser,
                apiKeys,
                createApiKey
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
