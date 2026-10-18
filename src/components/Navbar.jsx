import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    Image,
    Platform,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";
import logo from "../../assets/logo.png";
import { useAuth } from "../context/AuthContext";

const Navbar = ({ onBookTablePress, onCartPress }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, updateUser, logout } = useAuth();
    const { width } = useWindowDimensions();

    const [isOpen, setIsOpen] = useState(false);
    const [imageError, setImageError] = useState(false);

    const isAdmin = ["admin", "manager"].includes(
        String(user?.role || "").trim().toLowerCase()
    );

    const isAdminDashboard = pathname === "/admin/dashboard";
    const isDesktop = width >= 768;

    const profileImage =
        typeof user?.profileImage === "string"
            ? user.profileImage
            : user?.profileImage?.url ||
              user?.profileImage?.secure_url ||
              "";

    const refreshProfile = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const profileUrl = process.env.EXPO_PUBLIC_MY_PROFILE_URL;

            if (!token || !profileUrl) {
                return;
            }

            const response = await axios.get(profileUrl, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                withCredentials: true,
            });

            if (response.data?.user) {
                updateUser(response.data.user);
            }
        } catch (error) {
            console.log(
                "Navbar profile refresh failed:",
                error.response?.data?.message || error.message
            );
        }
    }, [updateUser]);

    useEffect(() => {
        if (isAuthenticated) {
            refreshProfile();
        }
    }, [isAuthenticated, refreshProfile]);

    useEffect(() => {
        setImageError(false);
    }, [profileImage]);

    const handleLogout = async () => {
        setIsOpen(false);
        try {
            const token = await AsyncStorage.getItem("token");
            const logoutUrl = process.env.EXPO_PUBLIC_LOGOUT_URL;

            if (token && logoutUrl) {
                await axios.get(logoutUrl, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    withCredentials: true,
                });
            }
        } catch (error) {
            console.log(
                "Backend logout failed:",
                error.response?.data?.message || error.message
            );
        } finally {
            await logout();
            router.replace("/");
        }
    };

    const handleNavigation = (route) => {
        setIsOpen(false);
        router.push(route);
    };

    return (
        <View
            style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: "#ffffff",
                borderBottomWidth: 1,
                borderBottomColor: "#e2e8f0",
                elevation: 3,
                boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
                zIndex: 999,
                position: "relative",
            }}
        >
            {/* Brand Logo & Name */}
            <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center" }}
                onPress={() => handleNavigation("/")}
                activeOpacity={0.8}
            >
                <Image
                    source={logo}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        marginRight: 10,
                    }}
                    resizeMode="cover"
                />
                <Text
                    style={{
                        fontSize: 20,
                        fontWeight: "800",
                        color: "#1e293b",
                        letterSpacing: -0.5,
                    }}
                >
                    Bite<Text style={{ color: "#2563eb" }}>Flow</Text>
                </Text>
            </TouchableOpacity>

            {/* Right Actions: Book Table Button, Cart & Profile Menu */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {onBookTablePress && (
                    <TouchableOpacity
                        onPress={onBookTablePress}
                        style={{
                            backgroundColor: "#eff6ff",
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: "#bfdbfe",
                        }}
                        activeOpacity={0.8}
                    >
                        <Text style={{ color: "#2563eb", fontWeight: "700", fontSize: 12 }}>
                            📅 Book Table
                        </Text>
                    </TouchableOpacity>
                )}

                {onCartPress && (
                    <TouchableOpacity
                        onPress={onCartPress}
                        style={{
                            backgroundColor: "#2563eb",
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: 20,
                        }}
                        activeOpacity={0.8}
                    >
                        <Text style={{ color: "#ffffff", fontWeight: "600", fontSize: 12 }}>
                            Cart
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Profile Avatar / Auth Dropdown Trigger */}
                <View style={{ position: "relative", zIndex: 1000, marginLeft: 4 }}>
                    <TouchableOpacity
                        onPress={() => setIsOpen((prev) => !prev)}
                        style={{
                            borderRadius: 9999,
                            borderWidth: 2,
                            borderColor: "#22c55e",
                        }}
                        activeOpacity={0.8}
                    >
                        <View
                            style={{
                                height: 36,
                                width: 36,
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: 9999,
                                backgroundColor: "#FFFFFF",
                                padding: 2,
                                overflow: "hidden",
                            }}
                        >
                            {isAuthenticated && profileImage && !imageError ? (
                                <Image
                                    key={profileImage}
                                    source={{ uri: profileImage }}
                                    style={{
                                        height: "100%",
                                        width: "100%",
                                        borderRadius: 9999,
                                    }}
                                    resizeMode="cover"
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                <Image
                                    source={logo}
                                    style={{
                                        height: "100%",
                                        width: "100%",
                                        borderRadius: 9999,
                                    }}
                                    resizeMode="cover"
                                />
                            )}
                        </View>
                    </TouchableOpacity>

                    {/* Dropdown Menu */}
                    {isOpen && (
                        <View
                            style={{
                                position: "absolute",
                                right: 0,
                                top: 45,
                                width: 210,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: "#E2E8F0",
                                backgroundColor: "#FFFFFF",
                                paddingVertical: 4,
                                zIndex: 9999,
                                elevation: 20,
                                boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
                                ...(isDesktop ? {} : { maxWidth: width - 32 }),
                                ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
                            }}
                        >
                            {isAuthenticated ? (
                                <>
                                    <TouchableOpacity
                                        style={{
                                            borderBottomWidth: 1,
                                            borderColor: "#F1F5F9",
                                            paddingHorizontal: 16,
                                            paddingVertical: 12,
                                        }}
                                        onPress={() => handleNavigation("/account")}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                fontWeight: "600",
                                                color: "#0F172A",
                                            }}
                                        >
                                            My Account
                                        </Text>
                                    </TouchableOpacity>

                                    {isAdmin && !isAdminDashboard && (
                                        <TouchableOpacity
                                            style={{
                                                borderBottomWidth: 1,
                                                borderColor: "#F1F5F9",
                                                paddingHorizontal: 16,
                                                paddingVertical: 12,
                                            }}
                                            onPress={() => handleNavigation("/admin/dashboard")}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: "600",
                                                    color: "#0F172A",
                                                }}
                                            >
                                                Admin Dashboard
                                            </Text>
                                        </TouchableOpacity>
                                    )}

                                    {isAdmin && isAdminDashboard && (
                                        <TouchableOpacity
                                            style={{
                                                borderBottomWidth: 1,
                                                borderColor: "#F1F5F9",
                                                paddingHorizontal: 16,
                                                paddingVertical: 12,
                                            }}
                                            onPress={() => handleNavigation("/")}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: "600",
                                                    color: "#0F172A",
                                                }}
                                            >
                                                Home
                                            </Text>
                                        </TouchableOpacity>
                                    )}

                                    <TouchableOpacity
                                        style={{
                                            paddingHorizontal: 16,
                                            paddingVertical: 12,
                                        }}
                                        onPress={handleLogout}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                fontWeight: "600",
                                                color: "#DC2626",
                                            }}
                                        >
                                            Logout
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <TouchableOpacity
                                        style={{
                                            borderBottomWidth: 1,
                                            borderColor: "#F1F5F9",
                                            paddingHorizontal: 16,
                                            paddingVertical: 12,
                                        }}
                                        onPress={() => handleNavigation("/signin")}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                fontWeight: "600",
                                                color: "#0F172A",
                                            }}
                                        >
                                            Sign In
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={{
                                            paddingHorizontal: 16,
                                            paddingVertical: 12,
                                        }}
                                        onPress={() => handleNavigation("/signup")}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                fontWeight: "600",
                                                color: "#0F172A",
                                            }}
                                        >
                                            Sign Up
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

export default Navbar;