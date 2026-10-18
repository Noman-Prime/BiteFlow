import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Navbar from "../../../components/Navbar";
import Toast from "../../../components/Toast";

// Compact grid box for account info
const DetailGridBox = ({ icon, label, value, iconBg = "bg-emerald-50", iconColor = "#10B981" }) => (
    <View className="flex-1 rounded-2xl bg-gray-50/80 p-3.5 border border-gray-100">
        <View className="flex-row items-center mb-2">
            <View className={`h-8 w-8 items-center justify-center rounded-xl ${iconBg}`}>
                <Ionicons name={icon} size={16} color={iconColor} />
            </View>
            <Text className="ml-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                {label}
            </Text>
        </View>
        <Text className="text-sm font-bold text-gray-900" numberOfLines={1} adjustsFontSizeToFit>
            {value || "N/A"}
        </Text>
    </View>
);

const UserDetails = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({
        visible: false,
        type: "success",
        message: "",
    });

    const showToast = (type, message) => {
        setToast({ visible: true, type, message });
    };

    const hideToast = () => {
        setToast((prev) => ({ ...prev, visible: false }));
    };

    const fetchUser = useCallback(async () => {
        if (!id) {
            setUser(null);
            setLoading(false);
            showToast("error", "User ID is missing.");
            return;
        }

        try {
            setLoading(true);
            const baseUrl = process.env.EXPO_PUBLIC_GET_USER_BY_ID_URL;
            const token = await AsyncStorage.getItem("token");

            if (!baseUrl) {
                throw new Error("EXPO_PUBLIC_GET_USER_BY_ID_URL is missing in .env.");
            }

            const url = `${baseUrl.replace(/\/+$/, "")}/${encodeURIComponent(id)}`;

            const response = await axios.get(url, {
                headers: {
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                withCredentials: true,
            });

            const userData =
                response.data?.user ||
                response.data?.data?.user ||
                response.data?.data;

            if (!userData?._id) {
                setUser(null);
                showToast("error", "User details were not found.");
                return;
            }

            setUser(userData);
        } catch (error) {
            console.log("Fetch user error:", error.response?.data || error.message);
            setUser(null);
            showToast(
                "error",
                error.response?.data?.message ||
                    error.message ||
                    "Failed to load user details."
            );
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const role = user?.role || "Customer";
    const isManager = role.toLowerCase() === "manager";
    const profileImage = user?.profileImage?.url;

    const formatDate = (date) => {
        if (!date) return "N/A";
        const parsedDate = new Date(date);
        return Number.isNaN(parsedDate.getTime())
            ? "N/A"
            : parsedDate.toLocaleDateString();
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "left", "right"]}>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />
            <Navbar />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Back Button & Top ID Tag */}
                <View className="mb-6 flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        activeOpacity={0.7}
                        className="flex-row items-center rounded-xl bg-white px-3.5 py-2.5 shadow-sm shadow-gray-100 border border-gray-100"
                    >
                        <Ionicons name="arrow-back" size={18} color="#374151" />
                        <Text className="ml-2 text-xs font-bold text-gray-700">Back</Text>
                    </TouchableOpacity>

                    <View className="flex-row items-center rounded-full bg-emerald-50 px-3 py-1 border border-emerald-100">
                        <View className="mr-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                        <Text className="text-[11px] font-bold text-emerald-700">
                            ID: {id?.slice(-6).toUpperCase()}
                        </Text>
                    </View>
                </View>

                {loading ? (
                    <View className="items-center justify-center rounded-3xl bg-white py-24 shadow-sm">
                        <ActivityIndicator size="large" color="#10B981" />
                        <Text className="mt-4 text-xs font-semibold text-gray-400">
                            Loading user profile...
                        </Text>
                    </View>
                ) : !user ? (
                    <View className="items-center rounded-3xl bg-white px-5 py-12 shadow-sm">
                        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                            <Ionicons name="person-outline" size={30} color="#10B981" />
                        </View>
                        <Text className="mt-4 text-base font-bold text-gray-900">
                            Unable to Load User
                        </Text>
                        <Text className="mt-1 text-center text-xs text-gray-400">
                            We couldn't retrieve this user's information.
                        </Text>
                        <TouchableOpacity
                            onPress={fetchUser}
                            activeOpacity={0.8}
                            className="mt-5 rounded-xl bg-emerald-600 px-6 py-3"
                        >
                            <Text className="text-xs font-bold text-white">Try Again</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* Main Unified Profile Card */}
                        <View className="rounded-3xl bg-white p-6 shadow-sm shadow-gray-100 border border-gray-100">
                            
                            {/* Header Section: Left (Info) & Right (Avatar) */}
                            <View className="flex-row items-center justify-between">
                                <View className="flex-1 pr-3">
                                    <View className="flex-row items-center">
                                        <Text className="text-xl font-extrabold text-gray-900">
                                            {user.name || "Unnamed User"}
                                        </Text>
                                    </View>

                                    <Text className="mt-0.5 text-xs font-medium text-gray-400">
                                        {user.email || "No email available"}
                                    </Text>

                                    <View className="mt-3 flex-row items-center gap-2">
                                        <View
                                            className={`flex-row items-center rounded-full px-3 py-1 border ${
                                                isManager
                                                    ? "border-purple-200 bg-purple-50"
                                                    : "border-emerald-200 bg-emerald-50"
                                            }`}
                                        >
                                            <Ionicons
                                                name="shield-checkmark"
                                                size={12}
                                                color={isManager ? "#7E22CE" : "#059669"}
                                            />
                                            <Text
                                                className={`ml-1 text-[11px] font-bold ${
                                                    isManager ? "text-purple-700" : "text-emerald-700"
                                                }`}
                                            >
                                                {role}
                                            </Text>
                                        </View>

                                        {/* Active Status Badge */}
                                        <View className="flex-row items-center rounded-full bg-emerald-100/60 px-2.5 py-1 border border-emerald-200/50">
                                            <Text className="text-[10px] font-bold text-emerald-800">
                                                Active
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Avatar on Right */}
                                {profileImage ? (
                                    <Image
                                        source={{ uri: profileImage }}
                                        className="h-20 w-20 rounded-2xl border-2 border-emerald-200"
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View className="h-20 w-20 items-center justify-center rounded-2xl bg-emerald-100 border-2 border-emerald-200">
                                        <Text className="text-2xl font-black text-emerald-700">
                                            {user.name?.trim()?.charAt(0)?.toUpperCase() || "U"}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Section Divider */}
                            <View className="my-6 h-[1px] w-full bg-gray-100" />

                            {/* Account Details Heading */}
                            <View className="mb-4 flex-row items-center">
                                <View className="mr-2.5 h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
                                    <Ionicons name="grid-outline" size={15} color="#10B981" />
                                </View>
                                <Text className="text-xs font-extrabold uppercase tracking-wider text-gray-800">
                                    Account Information
                                </Text>
                            </View>

                            {/* 2-Column Organized Grid */}
                            <View className="gap-3">
                                <View className="flex-row gap-3">
                                    <DetailGridBox
                                        icon="person-outline"
                                        label="Full Name"
                                        value={user.name}
                                        iconBg="bg-emerald-50"
                                        iconColor="#10B981"
                                    />
                                    <DetailGridBox
                                        icon="mail-outline"
                                        label="Email"
                                        value={user.email}
                                        iconBg="bg-emerald-50"
                                        iconColor="#10B981"
                                    />
                                </View>

                                <View className="flex-row gap-3">
                                    <DetailGridBox
                                        icon="shield-outline"
                                        label="Role"
                                        value={role}
                                        iconBg="bg-emerald-50"
                                        iconColor="#10B981"
                                    />
                                    <DetailGridBox
                                        icon="calendar-outline"
                                        label="Joined On"
                                        value={formatDate(user.createdAt)}
                                        iconBg="bg-emerald-50"
                                        iconColor="#10B981"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Full-width Update Role Action Button */}
                        <View className="mt-4">
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => showToast("info", "Role update feature coming soon!")}
                                className="w-full flex-row items-center justify-center rounded-2xl bg-emerald-600 py-3.5 shadow-sm shadow-emerald-200"
                            >
                                <Ionicons name="shield-checkmark-outline" size={18} color="#FFFFFF" />
                                <Text className="ml-2 text-xs font-bold text-white">Update Role</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
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

export default UserDetails;