import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Navbar from "../../components/Navbar";
import Toast from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";

const Account = () => {
    const router = useRouter();
    const { isAuthenticated, logout } = useAuth();

    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [toast, setToast] = useState({
        visible: false,
        type: "success",
        message: "",
    });

    useEffect(() => {
        let isMounted = true;

        const fetchProfile = async () => {
            try {
                const token = await AsyncStorage.getItem("token");
                const profileUrl = process.env.EXPO_PUBLIC_MY_PROFILE_URL;

                if (!token || !profileUrl) return;

                const response = await axios.get(
                    profileUrl,
                    {},
                    {
                        headers: {
                            Authorization: "Bearer " + token,
                        },
                        withCredentials: true,
                    }
                );

                if (isMounted) {
                    setProfile(response.data?.user || null);
                }
            } catch {
                if (isMounted) {
                    setProfile(null);
                }
            } finally {
                if (isMounted) {
                    setProfileLoading(false);
                }
            }
        };

        if (isAuthenticated) {
            setProfileLoading(true);
            fetchProfile();
        } else {
            setProfile(null);
            setProfileLoading(false);
        }

        return () => {
            isMounted = false;
        };
    }, [isAuthenticated]);

    const hideToast = () => {
        setToast((prev) => ({ ...prev, visible: false }));
    };

    const handleLogout = async () => {
        try {
            setLoggingOut(true);
            await logout();
            router.replace("/");
        } catch {
            setToast({
                visible: true,
                type: "error",
                message: "Unable to log out. Please try again.",
            });
        } finally {
            setLoggingOut(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return "N/A";

        const parsedDate = new Date(date);

        return Number.isNaN(parsedDate.getTime())
            ? "N/A"
            : parsedDate.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
              });
    };

    const profileImage = profile?.profileImage?.url || null;
    const initial = profile?.name?.trim()?.charAt(0)?.toUpperCase() || "U";

    useEffect(() => {
        setImageError(false);
        setImageLoading(Boolean(profileImage));
    }, [profileImage]);

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "left", "right"]}>
            <StatusBar style="light" backgroundColor="#000000" />
            <Navbar />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 110 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="rounded-b-[36px] bg-black px-6 pb-12 pt-6 shadow-lg">
                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="text-2xl font-black tracking-tight text-white">
                                Account Overview
                            </Text>
                            <Text className="mt-1 text-xs font-semibold text-gray-400">
                                Manage your profile & preferences
                            </Text>
                        </View>

                        <View className="h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                            <Ionicons name="person" size={20} color="#10B981" />
                        </View>
                    </View>
                </View>

                <View className="-mt-8 px-5">
                    {!isAuthenticated ? (
                        <View className="items-center rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
                            <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl border border-orange-100 bg-orange-50">
                                <Ionicons name="lock-closed-outline" size={30} color="#F97316" />
                            </View>

                            <Text className="text-lg font-extrabold text-black">
                                Sign In Required
                            </Text>

                            <Text className="mt-1.5 text-center text-xs leading-5 text-gray-500">
                                Connect to your account to view profile information,
                                order history, and reservations.
                            </Text>

                            <TouchableOpacity
                                onPress={() => router.push("/signin")}
                                activeOpacity={0.8}
                                className="mt-6 w-full flex-row items-center justify-center rounded-2xl bg-emerald-600 py-4"
                            >
                                <Ionicons name="log-in-outline" size={18} color="#FFFFFF" />
                                <Text className="ml-2 text-xs font-bold text-white">
                                    Sign In Now
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : profileLoading ? (
                        <View className="items-center rounded-3xl border border-gray-100 bg-white p-10 shadow-sm">
                            <ActivityIndicator size="large" color="#10B981" />
                            <Text className="mt-3 text-xs font-semibold text-gray-500">
                                Loading your profile...
                            </Text>
                        </View>
                    ) : !profile ? (
                        <View className="items-center rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
                            <Ionicons name="alert-circle-outline" size={36} color="#F97316" />
                            <Text className="mt-3 text-base font-extrabold text-black">
                                Unable to Load Profile
                            </Text>
                            <Text className="mt-1 text-center text-xs text-gray-500">
                                Please check your connection and try again.
                            </Text>

                            <TouchableOpacity
                                onPress={() => router.replace("/account")}
                                className="mt-5 rounded-2xl bg-black px-6 py-3"
                            >
                                <Text className="text-xs font-bold text-white">
                                    Try Again
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <View className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                                <View className="flex-row items-center">
                                    <View className="relative h-20 w-20">
                                        {profileImage && !imageError ? (
                                            <Image
                                                key={profileImage}
                                                source={{ uri: profileImage }}
                                                className="h-20 w-20 rounded-2xl border-2 border-emerald-500"
                                                resizeMode="cover"
                                                onLoad={() => {
                                                    setImageLoading(false);
                                                    setImageError(false);
                                                }}
                                                onError={() => {
                                                    setImageLoading(false);
                                                    setImageError(true);
                                                }}
                                            />
                                        ) : (
                                            <View className="h-20 w-20 items-center justify-center rounded-2xl border-2 border-orange-500 bg-orange-50">
                                                <Text className="text-3xl font-black text-orange-600">
                                                    {initial}
                                                </Text>
                                            </View>
                                        )}

                                        {imageLoading && !imageError && (
                                            <View className="absolute inset-0 items-center justify-center rounded-2xl bg-white/70">
                                                <ActivityIndicator color="#10B981" />
                                            </View>
                                        )}

                                        <View className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-emerald-600 p-1">
                                            <Ionicons name="checkmark-sharp" size={10} color="#FFFFFF" />
                                        </View>
                                    </View>

                                    <View className="ml-4 flex-1">
                                        <Text className="text-base font-extrabold text-black" numberOfLines={1}>
                                            {profile.name || "BiteFlow User"}
                                        </Text>

                                        <Text className="mt-0.5 text-xs font-semibold text-gray-400" numberOfLines={1}>
                                            {profile.email || "No email available"}
                                        </Text>

                                        <View className="mt-2.5 flex-row items-center self-start rounded-xl border border-emerald-100 bg-emerald-50 px-2.5 py-1">
                                            <Ionicons name="shield-checkmark-outline" size={12} color="#10B981" />
                                            <Text className="ml-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                                                {profile.role || "Customer"}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={() => router.push("/account/edit")}
                                    activeOpacity={0.8}
                                    className="mt-5 w-full flex-row items-center justify-center rounded-2xl bg-black py-3.5"
                                >
                                    <Ionicons name="create-outline" size={16} color="#FFFFFF" />
                                    <Text className="ml-2 text-xs font-bold text-white">
                                        Edit Profile
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View className="mt-4 flex-row gap-3">
                                <TouchableOpacity
                                    onPress={() => router.push("/account/orders")}
                                    activeOpacity={0.8}
                                    className="flex-1 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm"
                                >
                                    <View className="mb-3 h-10 w-10 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50">
                                        <Ionicons name="receipt-outline" size={20} color="#10B981" />
                                    </View>
                                    <Text className="text-xs font-extrabold text-black">Orders</Text>
                                    <Text className="mt-0.5 text-[10px] text-gray-400">
                                        Track & History
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => router.push("/account/reservations")}
                                    activeOpacity={0.8}
                                    className="flex-1 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm"
                                >
                                    <View className="mb-3 h-10 w-10 items-center justify-center rounded-2xl border border-orange-100 bg-orange-50">
                                        <Ionicons name="calendar-outline" size={20} color="#F97316" />
                                    </View>
                                    <Text className="text-xs font-extrabold text-black">Reservations</Text>
                                    <Text className="mt-0.5 text-[10px] text-gray-400">
                                        Bookings
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View className="mt-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                                <Text className="mb-3 text-xs font-black uppercase tracking-wider text-black">
                                    Personal Details
                                </Text>

                                <View className="gap-3">
                                    <View className="flex-row items-center justify-between border-b border-gray-100 py-2">
                                        <View className="flex-row items-center">
                                            <Ionicons name="person-outline" size={16} color="#9CA3AF" />
                                            <Text className="ml-2.5 text-xs font-bold text-gray-500">
                                                Full Name
                                            </Text>
                                        </View>
                                        <Text className="ml-3 flex-1 text-right text-xs font-extrabold text-black">
                                            {profile.name || "N/A"}
                                        </Text>
                                    </View>

                                    <View className="flex-row items-center justify-between border-b border-gray-100 py-2">
                                        <View className="flex-row items-center">
                                            <Ionicons name="mail-outline" size={16} color="#9CA3AF" />
                                            <Text className="ml-2.5 text-xs font-bold text-gray-500">
                                                Email Address
                                            </Text>
                                        </View>
                                        <Text className="ml-3 flex-1 text-right text-xs font-extrabold text-black">
                                            {profile.email || "N/A"}
                                        </Text>
                                    </View>

                                    <View className="flex-row items-center justify-between py-2">
                                        <View className="flex-row items-center">
                                            <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                                            <Text className="ml-2.5 text-xs font-bold text-gray-500">
                                                Member Since
                                            </Text>
                                        </View>
                                        <Text className="ml-3 text-xs font-extrabold text-black">
                                            {formatDate(profile.createdAt)}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={handleLogout}
                                disabled={loggingOut}
                                activeOpacity={0.8}
                                className="mt-5 flex-row items-center justify-center rounded-2xl border border-red-100 bg-red-50 py-4"
                            >
                                {loggingOut ? (
                                    <ActivityIndicator size="small" color="#DC2626" />
                                ) : (
                                    <Ionicons name="log-out-outline" size={18} color="#DC2626" />
                                )}
                                <Text className="ml-2 text-xs font-bold text-red-600">
                                    {loggingOut ? "Logging Out..." : "Sign Out"}
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </ScrollView>

            <Toast
                visible={toast.visible}
                type={toast.type}
                message={toast.message}
                onHide={hideToast}
            />
        </SafeAreaView>
    );
};

export default Account;