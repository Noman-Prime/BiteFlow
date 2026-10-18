import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Navbar from "../../../components/Navbar";
import Toast from "../../../components/Toast";

const UserManagement = () => {
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
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

    const fetchUsers = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const url = process.env.EXPO_PUBLIC_GET_ALL_USERS_URL;

            if (!url) {
                throw new Error("EXPO_PUBLIC_GET_ALL_USERS_URL is missing in .env.");
            }

            const response = await axios.get(url, {
                headers: {
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                withCredentials: true,
            });

            setUsers(response.data.users || []);
        } catch (error) {
            console.log("Fetch users error:", error.response?.data || error.message);

            showToast(
                "error",
                error.response?.data?.message || error.message || "Failed to load users."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchUsers();
        }, [fetchUsers])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchUsers();
    };

    const renderUser = ({ item }) => {
        const userId = item._id || item.id;
        const role = item.role || "Customer";
        const isManager = role.toLowerCase() === "manager" || role.toLowerCase() === "admin";
        const profileImage = item.profileImage?.url;

        return (
            <TouchableOpacity
                onPress={() => {
                    if (userId) {
                        router.push(`/admin/user/${userId}`);
                    } else {
                        showToast("error", "Invalid user ID.");
                    }
                }}
                activeOpacity={0.8}
                className="mb-3 flex-row items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm"
            >
                {profileImage ? (
                    <Image
                        source={{ uri: profileImage }}
                        className="mr-3 h-11 w-11 rounded-xl"
                        resizeMode="cover"
                    />
                ) : (
                    <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-[#EFF6FF] border border-[#DBEAFE]">
                        <Text className="text-lg font-extrabold text-[#2563EB]">
                            {item.name?.trim()?.charAt(0)?.toUpperCase() || "U"}
                        </Text>
                    </View>
                )}

                <View className="flex-1 pr-2">
                    <Text
                        numberOfLines={1}
                        className="text-base font-extrabold text-[#0F172A]"
                    >
                        {item.name || "Unnamed User"}
                    </Text>

                    <Text
                        numberOfLines={1}
                        className="mt-0.5 text-xs font-semibold text-[#64748B]"
                    >
                        {item.email || "No email available"}
                    </Text>

                    <Text className="mt-1 text-xs text-[#94A3B8]">
                        Joined {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Unknown"}
                    </Text>
                </View>

                <View className="items-end">
                    <View
                        className={`rounded-xl border px-3 py-1.5 ${isManager
                                ? "border-purple-200 bg-purple-50"
                                : "border-[#DBEAFE] bg-[#EFF6FF]"
                            }`}
                    >
                        <Text
                            className={`text-xs font-bold ${isManager ? "text-purple-700" : "text-[#2563EB]"
                                }`}
                        >
                            {role}
                        </Text>
                    </View>

                    <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#94A3B8"
                        style={{ marginTop: 8 }}
                    />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />

            <View className="flex-1 bg-white">
                <Navbar />

                <View className="flex-1 bg-[#F8FAFC] px-5 pt-5">
                    <View className="mb-5">
                        <Text className="text-2xl font-extrabold text-[#0F172A]">
                            User <Text className="text-[#2563EB]">Management</Text>
                        </Text>

                        <Text className="mt-0.5 text-xs text-[#64748B]">
                            View and manage registered users
                        </Text>

                        <View className="mt-4 flex-row items-center rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
                            <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-[#EFF6FF] border border-[#DBEAFE]">
                                <Ionicons name="people-outline" size={25} color="#2563EB" />
                            </View>

                            <View>
                                <Text className="text-xs font-semibold text-[#64748B]">
                                    Total Users
                                </Text>

                                <Text className="mt-0.5 text-2xl font-extrabold text-[#0F172A]">
                                    {users.length}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {loading ? (
                        <View className="flex-1 items-center justify-center">
                            <ActivityIndicator size="large" color="#2563EB" />

                            <Text className="mt-3 text-sm font-medium text-[#64748B]">
                                Loading users...
                            </Text>
                        </View>
                    ) : users.length === 0 ? (
                        <View className="mb-6 flex-1 items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white px-5 py-12 shadow-sm">
                            <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl border border-[#DBEAFE] bg-[#EFF6FF]">
                                <Ionicons name="people-outline" size={32} color="#2563EB" />
                            </View>

                            <Text className="mb-1 text-lg font-bold text-[#0F172A]">
                                No Users Found
                            </Text>

                            <Text className="text-center text-xs leading-5 text-[#64748B]">
                                Registered customers and managers will appear here.
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={users}
                            keyExtractor={(item, index) =>
                                item._id ? item._id.toString() : index.toString()
                            }
                            renderItem={renderUser}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 24 }}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={onRefresh}
                                    tintColor="#2563EB"
                                    colors={["#2563EB"]}
                                />
                            }
                        />
                    )}
                </View>
            </View>

            <Toast
                visible={toast.visible}
                type={toast.type}
                message={toast.message}
                onHide={hideToast}
            />
        </SafeAreaView>
    );
};

export default UserManagement;