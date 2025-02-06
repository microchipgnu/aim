"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

interface ApiKey {
    id: string;
    userId: string;
    key: string;
}

interface AuthContextType {
    session: any;
    user: any;
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
    const [session, setSession] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
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

    const updateSessionAndUser = async () => {
        const { data } = await authClient.getSession();
        setSession(data?.session);
        setUser(data?.user);
        if (data?.session) {
            fetchApiKeys();
        }
    };

    useEffect(() => {
        updateSessionAndUser().finally(() => setIsLoading(false));
    }, []);

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
