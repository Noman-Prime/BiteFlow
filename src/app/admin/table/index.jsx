import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Navbar from "../../../components/Navbar";
import Toast from "../../../components/Toast";

const TableManagement = () => {
    const router = useRouter();
    const [tables, setTables] = useState([]);
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
    const apiUrl = process.env.EXPO_PUBLIC_TABLE_URL;

    const fetchTables = useCallback(async () => {
        if (!apiUrl) {
            showToast("error", "EXPO_PUBLIC_TABLE_URL is missing in .env file.");
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            const token = await AsyncStorage.getItem("token");

            const response = await axios.get(apiUrl, {
                headers: {
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                withCredentials: true,
            });

            let fetchedTables = [];

            if (Array.isArray(response.data)) {
                fetchedTables = response.data;
            } else if (Array.isArray(response.data?.data)) {
                fetchedTables = response.data.data;
            } else if (Array.isArray(response.data?.tables)) {
                fetchedTables = response.data.tables;
            } else if (response.data && typeof response.data === "object") {
                const possibleArray = Object.values(response.data).find((val) =>
                    Array.isArray(val)
                );
                if (possibleArray) fetchedTables = possibleArray;
            }

            setTables(fetchedTables);
        } catch (err) {
            console.error("Error fetching tables:", err);
            const errorMsg =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Failed to load tables.";
            showToast("error", errorMsg);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [apiUrl]);

    useFocusEffect(
        useCallback(() => {
            fetchTables();
        }, [fetchTables])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchTables();
    };

    const renderTableItem = ({ item }) => {
        const tableId = item._id || item.id;
        const isAvailable = item.isAvailable !== false;

        return (
            <TouchableOpacity
                onPress={() => {
                    if (tableId) {
                        router.push(`/admin/table/${tableId}`);
                    } else {
                        showToast("error", "Invalid table ID.");
                    }
                }}
                activeOpacity={0.8}
                className="mb-3.5 flex-row items-center justify-between rounded-3xl border border-[#DBEAFE] bg-white p-4 shadow-sm"
            >
                <View className="flex-row items-center flex-1">
                    <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] mr-3">
                        <Ionicons name="restaurant-outline" size={22} color="#2563EB" />
                    </View>

                    <View className="flex-1 pr-3">
                        <Text className="text-xs font-black text-[#0F172A]">
                            Table #{item.tableNumber ?? "N/A"}
                        </Text>
                        <Text className="mt-0.5 text-[10px] font-medium text-[#64748B]">
                            {item.seats ?? 1} {Number(item.seats) === 1 ? "Person Capacity" : "Persons Capacity"}
                        </Text>
                    </View>
                </View>

                <View
                    className={`rounded-xl px-3 py-1 border ${
                        isAvailable
                            ? "bg-emerald-50 border-emerald-200"
                            : "bg-red-50 border-red-200"
                    }`}
                >
                    <Text
                        className={`text-[10px] font-extrabold uppercase ${
                            isAvailable ? "text-emerald-700" : "text-red-700"
                        }`}
                    >
                        {isAvailable ? "Available" : "Reserved"}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={["top"]}>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />
            
            <View className="bg-white pb-2 pt-1 border-b border-[#F1F5F9]">
                <Navbar />
            </View>

            <View className="flex-1 px-5 pt-4">
                {/* Header & Create Button Section */}
                <View className="mb-4 flex-row items-center justify-between">
                    <View className="flex-1 pr-2">
                        <Text className="text-xl font-black text-[#0F172A]">
                            Table Management
                        </Text>
                        <Text className="mt-0.5 text-xs text-[#64748B]">
                            {tables.length} {tables.length === 1 ? "Table" : "Tables"} available
                        </Text>
                    </View>

                    {/* Create Table Button */}
                    <TouchableOpacity
                        className="flex-row items-center rounded-2xl bg-[#2563EB] px-4 py-3 shadow-sm active:opacity-90"
                        onPress={() => router.push("/admin/table/add")}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                        <Text className="ml-1.5 text-xs font-bold text-white">
                            Create Table
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Main Content View */}
                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#2563EB" />
                        <Text className="mt-3 text-xs font-bold text-[#64748B]">
                            Loading tables...
                        </Text>
                    </View>
                ) : tables.length === 0 ? (
                    /* Empty State Container */
                    <View className="flex-1 items-center justify-center rounded-3xl border border-[#DBEAFE] bg-white px-5 py-12 mb-6 shadow-sm">
                        <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-[#EFF6FF] border border-[#DBEAFE]">
                            <Ionicons name="grid-outline" size={36} color="#2563EB" />
                        </View>

                        <Text className="mb-1 text-base font-extrabold text-[#0F172A]">
                            No Tables Found
                        </Text>

                        <Text className="mb-6 text-center text-xs text-[#64748B]">
                            Start by creating tables to set up your restaurant seating.
                        </Text>

                        <TouchableOpacity
                            className="w-full flex-row items-center justify-center rounded-2xl bg-[#2563EB] px-5 py-3.5 shadow-sm"
                            onPress={() => router.push("/admin/table/add")}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                            <Text className="ml-2 text-xs font-bold text-white">
                                Add First Table
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    /* Tables List */
                    <FlatList
                        data={tables}
                        keyExtractor={(item, index) =>
                            item._id ? item._id.toString() : index.toString()
                        }
                        renderItem={renderTableItem}
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

            <Toast
                visible={toast.visible}
                type={toast.type}
                message={toast.message}
                onHide={hideToast}
            />
        </SafeAreaView>
    );
};

export default TableManagement;