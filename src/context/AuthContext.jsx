import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

const MY_PROFILE_URL = process.env.EXPO_PUBLIC_MY_PROFILE_URL;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const login = (userData) => {
        setUser(userData || {});
    };

    const updateUser = (userData) => {
        setUser((prevUser) => ({
            ...(prevUser || {}),
            ...(userData || {}),
            profileImage:
                userData?.profileImage ?? prevUser?.profileImage ?? null,
        }));
    };

    const refreshUser = async () => {
        if (!MY_PROFILE_URL) {
            throw new Error("Profile API URL is not configured.");
        }

        const token = await AsyncStorage.getItem("token");

        if (!token) {
            throw new Error("Authentication token not found.");
        }

        const response = await axios.get(MY_PROFILE_URL, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
        });

        const latestUser = response.data?.user;

        if (!latestUser) {
            throw new Error("Unable to retrieve user profile.");
        }

        setUser((prevUser) => ({
            ...(prevUser || {}),
            ...latestUser,
        }));

        return latestUser;
    };

    const logout = () => {
        setUser(null);
    };

    const isAuthenticated = user !== null;

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                login,
                updateUser,
                refreshUser,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);