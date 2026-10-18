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
        <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={["top", "left", "right"]}>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />
            <Navbar />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 110 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Banner */}
                <View className="rounded-b-[36px] bg-[#2563EB] px-6 pb-12 pt-6 shadow-sm">
                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="text-2xl font-black tracking-tight text-white">
                                Account Overview
                            </Text>
                            <Text className="mt-1 text-xs font-semibold text-blue-100">
                                Manage your profile & preferences
                            </Text>
                        </View>

                        <View className="h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/15">
                            <Ionicons name="person" size={20} color="#FFFFFF" />
                        </View>
                    </View>
                </View>

                <View className="-mt-8 px-5">
                    {!isAuthenticated ? (
                        <View className="items-center rounded-3xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
                            <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl border border-[#DBEAFE] bg-[#EFF6FF]">
                                <Ionicons name="lock-closed-outline" size={30} color="#2563EB" />
                            </View>

                            <Text className="text-lg font-extrabold text-[#0F172A]">
                                Sign In Required
                            </Text>

                            <Text className="mt-1.5 text-center text-xs leading-5 text-[#64748B]">
                                Connect to your account to view profile information,
                                order history, and reservations.
                            </Text>

                            <TouchableOpacity
                                onPress={() => router.push("/signin")}
                                activeOpacity={0.8}
                                className="mt-6 w-full flex-row items-center justify-center rounded-2xl bg-[#2563EB] py-4 shadow-sm"
                            >
                                <Ionicons name="log-in-outline" size={18} color="#FFFFFF" />
                                <Text className="ml-2 text-xs font-bold text-white">
                                    Sign In Now
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : profileLoading ? (
                        <View className="items-center rounded-3xl border border-[#E2E8F0] bg-white p-10 shadow-sm">
                            <ActivityIndicator size="large" color="#2563EB" />
                            <Text className="mt-3 text-xs font-semibold text-[#64748B]">
                                Loading your profile...
                            </Text>
                        </View>
                    ) : !profile ? (
                        <View className="items-center rounded-3xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
                            <Ionicons name="alert-circle-outline" size={36} color="#2563EB" />
                            <Text className="mt-3 text-base font-extrabold text-[#0F172A]">
                                Unable to Load Profile
                            </Text>
                            <Text className="mt-1 text-center text-xs text-[#64748B]">
                                Please check your connection and try again.
                            </Text>

                            <TouchableOpacity
                                onPress={() => router.replace("/account")}
                                className="mt-5 rounded-2xl bg-[#2563EB] px-6 py-3 shadow-sm"
                            >
                                <Text className="text-xs font-bold text-white">
                                    Try Again
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <View className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
                                <View className="flex-row items-center">
                                    <View className="relative h-20 w-20">
                                        {profileImage && !imageError ? (
                                            <Image
                                                key={profileImage}
                                                source={{ uri: profileImage }}
                                                className="h-20 w-20 rounded-2xl border-2 border-[#2563EB]"
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
                                            <View className="h-20 w-20 items-center justify-center rounded-2xl border-2 border-[#DBEAFE] bg-[#EFF6FF]">
                                                <Text className="text-3xl font-black text-[#2563EB]">
                                                    {initial}
                                                </Text>
                                            </View>
                                        )}

                                        {imageLoading && !imageError && (
                                            <View className="absolute inset-0 items-center justify-center rounded-2xl bg-white/70">
                                                <ActivityIndicator color="#2563EB" />
                                            </View>
                                        )}

                                        <View className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-[#2563EB] p-1">
                                            <Ionicons name="checkmark-sharp" size={10} color="#FFFFFF" />
                                        </View>
                                    </View>

                                    <View className="ml-4 flex-1">
                                        <Text className="text-base font-extrabold text-[#0F172A]" numberOfLines={1}>
                                            {profile.name || "BiteFlow User"}
                                        </Text>

                                        <Text className="mt-0.5 text-xs font-semibold text-[#64748B]" numberOfLines={1}>
                                            {profile.email || "No email available"}
                                        </Text>

                                        <View className="mt-2.5 flex-row items-center self-start rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] px-2.5 py-1">
                                            <Ionicons name="shield-checkmark-outline" size={12} color="#2563EB" />
                                            <Text className="ml-1 text-[10px] font-extrabold uppercase tracking-wider text-[#2563EB]">
                                                {profile.role || "Customer"}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={() => router.push("/account/edit")}
                                    activeOpacity={0.8}
                                    className="mt-5 w-full flex-row items-center justify-center rounded-2xl bg-[#2563EB] py-3.5 shadow-sm"
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
                                    className="flex-1 rounded-3xl border border-[#E2E8F0] bg-white p-4 shadow-sm"
                                >
                                    <View className="mb-3 h-10 w-10 items-center justify-center rounded-2xl border border-[#DBEAFE] bg-[#EFF6FF]">
                                        <Ionicons name="receipt-outline" size={20} color="#2563EB" />
                                    </View>
                                    <Text className="text-xs font-extrabold text-[#0F172A]">Orders</Text>
                                    <Text className="mt-0.5 text-[10px] text-[#64748B]">
                                        Track & History
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => router.push("/account/reservations")}
                                    activeOpacity={0.8}
                                    className="flex-1 rounded-3xl border border-[#E2E8F0] bg-white p-4 shadow-sm"
                                >
                                    <View className="mb-3 h-10 w-10 items-center justify-center rounded-2xl border border-[#DBEAFE] bg-[#EFF6FF]">
                                        <Ionicons name="calendar-outline" size={20} color="#2563EB" />
                                    </View>
                                    <Text className="text-xs font-extrabold text-[#0F172A]">Reservations</Text>
                                    <Text className="mt-0.5 text-[10px] text-[#64748B]">
                                        Bookings
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View className="mt-4 rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                                <Text className="mb-3 text-xs font-black uppercase tracking-wider text-[#0F172A]">
                                    Personal Details
                                </Text>

                                <View className="gap-3">
                                    <View className="flex-row items-center justify-between border-b border-[#F1F5F9] py-2">
                                        <View className="flex-row items-center">
                                            <Ionicons name="person-outline" size={16} color="#94A3B8" />
                                            <Text className="ml-2.5 text-xs font-bold text-[#64748B]">
                                                Full Name
                                            </Text>
                                        </View>
                                        <Text className="ml-3 flex-1 text-right text-xs font-extrabold text-[#0F172A]">
                                            {profile.name || "N/A"}
                                        </Text>
                                    </View>

                                    <View className="flex-row items-center justify-between border-b border-[#F1F5F9] py-2">
                                        <View className="flex-row items-center">
                                            <Ionicons name="mail-outline" size={16} color="#94A3B8" />
                                            <Text className="ml-2.5 text-xs font-bold text-[#64748B]">
                                                Email Address
                                            </Text>
                                        </View>
                                        <Text className="ml-3 flex-1 text-right text-xs font-extrabold text-[#0F172A]">
                                            {profile.email || "N/A"}
                                        </Text>
                                    </View>

                                    <View className="flex-row items-center justify-between py-2">
                                        <View className="flex-row items-center">
                                            <Ionicons name="calendar-outline" size={16} color="#94A3B8" />
                                            <Text className="ml-2.5 text-xs font-bold text-[#64748B]">
                                                Member Since
                                            </Text>
                                        </View>
                                        <Text className="ml-3 text-xs font-extrabold text-[#0F172A]">
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