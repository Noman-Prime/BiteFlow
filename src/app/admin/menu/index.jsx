import { Ionicons } from "@expo/vector-icons";
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

const MenuManagement = () => {
    const router = useRouter();
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Toast Notification State
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

    // Get API URL from environment variables
    const apiUrl =
        process.env.EXPO_PUBLIC_GET_MENU_URL ||
        process.env.EXPO_PUBLIC_MENU_URL;

    const fetchMenuItems = useCallback(async () => {
        if (!apiUrl) {
            showToast("error", "EXPO_PUBLIC_GET_MENU_URL is missing in .env file.");
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            const response = await axios.get(apiUrl, {
                headers: { Accept: "application/json" },
                withCredentials: true,
            });

            let fetchedItems = [];

            if (Array.isArray(response.data)) {
                fetchedItems = response.data;
            } else if (Array.isArray(response.data?.data)) {
                fetchedItems = response.data.data;
            } else if (Array.isArray(response.data?.menu)) {
                fetchedItems = response.data.menu;
            } else if (Array.isArray(response.data?.items)) {
                fetchedItems = response.data.items;
            } else if (response.data && typeof response.data === "object") {
                const possibleArray = Object.values(response.data).find((val) =>
                    Array.isArray(val)
                );
                if (possibleArray) fetchedItems = possibleArray;
            }

            setMenuItems(fetchedItems);
        } catch (err) {
            console.error("Error fetching menu items:", err);
            const errorMsg =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Failed to load menu items.";
            showToast("error", errorMsg);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [apiUrl]);

    // Use useFocusEffect so the list automatically re-fetches when navigating back
    useFocusEffect(
        useCallback(() => {
            fetchMenuItems();
        }, [fetchMenuItems])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchMenuItems();
    };

    const renderMenuItem = ({ item }) => {
        const imageUrl = item.image?.url || (typeof item.image === "string" ? item.image : null);
        const itemId = item._id || item.id;

        return (
            <TouchableOpacity
                onPress={() => {
                    if (itemId) {
                        router.push(`/admin/menu/${itemId}`);
                    } else {
                        showToast("error", "Invalid item ID.");
                    }
                }}
                activeOpacity={0.8}
                className="mb-4 flex-row overflow-hidden rounded-3xl border border-[#DBEAFE] bg-white p-3 shadow-sm"
            >
                {/* Item Image */}
                <View className="h-24 w-24 overflow-hidden rounded-2xl bg-[#EFF6FF]">
                    {imageUrl ? (
                        <Image
                            source={{ uri: imageUrl }}
                            className="h-full w-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="h-full w-full items-center justify-center bg-[#EFF6FF]">
                            <Ionicons name="fast-food-outline" size={30} color="#2563EB" />
                        </View>
                    )}
                </View>

                {/* Item Details */}
                <View className="ml-3 flex-1 justify-between py-0.5">
                    <View>
                        <View className="flex-row items-center justify-between">
                            <Text
                                className="flex-1 text-xs font-bold text-[#0F172A]"
                                numberOfLines={1}
                            >
                                {item.name || item.title || "Unnamed Item"}
                            </Text>
                            <Text className="ml-2 text-xs font-black text-[#2563EB]">
                                Rs. {item.price ?? 0}
                            </Text>
                        </View>

                        <Text
                            className="mt-1 text-xs text-[#64748B]"
                            numberOfLines={2}
                        >
                            {item.description || "No description available."}
                        </Text>
                    </View>

                    {/* Badges: Category & Availability */}
                    <View className="mt-2 flex-row items-center justify-between">
                        <View className="rounded-xl bg-[#EFF6FF] px-2.5 py-1 border border-[#DBEAFE]">
                            <Text className="text-[10px] font-extrabold text-[#2563EB]">
                                {item.category || "General"}
                            </Text>
                        </View>

                        <View
                            className={`rounded-xl px-2.5 py-1 border ${
                                item.isAvailable !== false
                                    ? "bg-blue-50 border-blue-100"
                                    : "bg-red-50 border-red-100"
                            }`}
                        >
                            <Text
                                className={`text-[10px] font-extrabold uppercase ${
                                    item.isAvailable !== false
                                        ? "text-blue-600"
                                        : "text-red-600"
                                }`}
                            >
                                {item.isAvailable !== false ? "Available" : "Unavailable"}
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={["top"]}>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />

            {/* Global Toast Popup */}
            <Toast
                visible={toast.visible}
                type={toast.type}
                message={toast.message}
                onHide={hideToast}
            />

            <View className="bg-white pb-2 pt-1 border-b border-[#F1F5F9]">
                <Navbar />
            </View>

            <View className="flex-1 px-5 pt-4">
                {/* Header & Create Button Section */}
                <View className="mb-4 flex-row items-center justify-between">
                    <View className="flex-1 pr-2">
                        <Text className="text-xl font-black text-[#0F172A]">
                            Menu Management
                        </Text>
                        <Text className="mt-0.5 text-xs text-[#64748B]">
                            {menuItems.length} {menuItems.length === 1 ? "Item" : "Items"} available
                        </Text>
                    </View>

                    {/* Create Menu Item Button */}
                    <TouchableOpacity
                        className="flex-row items-center rounded-2xl bg-[#2563EB] px-4 py-3 shadow-sm"
                        onPress={() => router.push("/admin/menu/add")}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                        <Text className="ml-1.5 text-xs font-bold text-white">
                            Create Item
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Main Content View */}
                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#2563EB" />
                        <Text className="mt-3 text-xs font-bold text-[#64748B]">
                            Loading menu items...
                        </Text>
                    </View>
                ) : menuItems.length === 0 ? (
                    /* Empty State Container */
                    <View className="flex-1 items-center justify-center rounded-3xl border border-[#DBEAFE] bg-white px-5 py-12 mb-6 shadow-sm">
                        <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl border border-[#DBEAFE] bg-[#EFF6FF]">
                            <Ionicons name="restaurant-outline" size={36} color="#2563EB" />
                        </View>

                        <Text className="mb-1 text-base font-extrabold text-[#0F172A]">
                            No Menu Items Found
                        </Text>

                        <Text className="mb-6 text-center text-xs text-[#64748B]">
                            Start by creating food items to build your restaurant menu.
                        </Text>

                        <TouchableOpacity
                            className="w-full flex-row items-center justify-center rounded-2xl bg-[#2563EB] px-5 py-3.5 shadow-sm"
                            onPress={() => router.push("/admin/menu/add")}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                            <Text className="ml-2 text-xs font-bold text-white">
                                Add First Menu Item
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    /* Menu Items List */
                    <FlatList
                        data={menuItems}
                        keyExtractor={(item, index) =>
                            item._id ? item._id.toString() : index.toString()
                        }
                        renderItem={renderMenuItem}
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
        </SafeAreaView>
    );
};

export default MenuManagement;