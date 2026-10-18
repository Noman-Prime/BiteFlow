import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    Image,
    Pressable,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";
import logo from "../../assets/logo.png";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
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

    const closeMenu = () => {
        setIsOpen(false);
    };

    const handleLogout = async () => {
        closeMenu();
        await logout();
        router.replace("/");
    };

    const handleNavigation = (route) => {
        closeMenu();
        router.push(route);
    };

    return (
        <View
            style={{
                zIndex: 50,
                backgroundColor: "#111827",
                position: "relative",
            }}
        >
            <View
                style={{
                    borderBottomWidth: 1,
                    borderColor: "#374151",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                }}
            >
                <View
                    style={{
                        width: "100%",
                        maxWidth: isDesktop ? 1200 : "100%",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        alignSelf: "center",
                    }}
                >
                    <TouchableOpacity
                        style={{ flexDirection: "row", alignItems: "center" }}
                        onPress={() => handleNavigation("/")}
                        activeOpacity={0.8}
                    >
                        <View
                            style={{
                                height: 48,
                                width: 144,
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "#FFFFFF",
                                borderRadius: 8,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                            }}
                        >
                            <Image
                                source={logo}
                                style={{ height: "100%", width: "100%" }}
                                resizeMode="contain"
                            />
                        </View>
                    </TouchableOpacity>

                    <View style={{ position: "relative", zIndex: 100 }}>
                        <TouchableOpacity
                            onPress={() => setIsOpen((previous) => !previous)}
                            style={{
                                borderRadius: 9999,
                                borderWidth: 2,
                                borderColor: "#F97316",
                            }}
                            activeOpacity={0.8}
                        >
                            <View
                                style={{
                                    height: 40,
                                    width: 40,
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
                                        onError={() => {
                                            console.log(
                                                "Navbar profile image failed:",
                                                profileImage
                                            );
                                            setImageError(true);
                                        }}
                                    />
                                ) : (
                                    <Image
                                        source={logo}
                                        style={{
                                            height: "100%",
                                            width: "100%",
                                            borderRadius: 9999,
                                        }}
                                        resizeMode="contain"
                                    />
                                )}
                            </View>
                        </TouchableOpacity>

                        {isOpen && (
                            <View
                                style={{
                                    position: "absolute",
                                    right: 0,
                                    top: 48,
                                    width: 208,
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: "#374151",
                                    backgroundColor: "#1F2937",
                                    paddingVertical: 8,
                                    zIndex: 1000,
                                    elevation: 25,
                                    ...(isDesktop ? {} : { maxWidth: width - 32 }),
                                }}
                            >
                                {isAuthenticated ? (
                                    <>
                                        <TouchableOpacity
                                            style={{
                                                borderBottomWidth: 1,
                                                borderColor: "rgba(55, 65, 81, 0.6)",
                                                paddingHorizontal: 16,
                                                paddingVertical: 12,
                                            }}
                                            onPress={() => handleNavigation("/account")}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: "600",
                                                    color: "#E5E7EB",
                                                }}
                                            >
                                                My Account
                                            </Text>
                                        </TouchableOpacity>

                                        {isAdmin && !isAdminDashboard && (
                                            <TouchableOpacity
                                                style={{
                                                    borderBottomWidth: 1,
                                                    borderColor: "rgba(55, 65, 81, 0.6)",
                                                    paddingHorizontal: 16,
                                                    paddingVertical: 12,
                                                }}
                                                onPress={() => handleNavigation("/admin/dashboard")}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                        fontWeight: "600",
                                                        color: "#E5E7EB",
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
                                                    borderColor: "rgba(55, 65, 81, 0.6)",
                                                    paddingHorizontal: 16,
                                                    paddingVertical: 12,
                                                }}
                                                onPress={() => handleNavigation("/")}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                        fontWeight: "600",
                                                        color: "#E5E7EB",
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
                                                    color: "#F87171",
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
                                                borderColor: "rgba(55, 65, 81, 0.6)",
                                                paddingHorizontal: 16,
                                                paddingVertical: 12,
                                            }}
                                            onPress={() => handleNavigation("/signin")}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: "600",
                                                    color: "#E5E7EB",
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
                                                    color: "#E5E7EB",
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

            {isOpen && (
                <Pressable
                    onPress={closeMenu}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 1,
                        zIndex: -1,
                    }}
                />
            )}
        </View>
    );
};

export default Navbar;