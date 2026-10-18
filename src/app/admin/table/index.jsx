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
                className="mb-3 flex-row items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
                <View className="flex-row items-center flex-1">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-orange-50 mr-3">
                        <Ionicons name="restaurant-outline" size={20} color="#F97316" />
                    </View>

                    <View className="flex-1 pr-3">
                        <Text className="text-base font-extrabold text-gray-900">
                            Table #{item.tableNumber ?? "N/A"}
                        </Text>
                        <Text className="mt-0.5 text-xs font-semibold text-gray-500">
                            {item.seats ?? 1} {Number(item.seats) === 1 ? "Person Capacity" : "Persons Capacity"}
                        </Text>
                    </View>
                </View>

                <View
                    className={`rounded-xl px-3 py-1.5 border ${
                        isAvailable
                            ? "bg-emerald-50 border-emerald-200"
                            : "bg-red-50 border-red-200"
                    }`}
                >
                    <Text
                        className={`text-xs font-bold ${
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
        <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />
            
            {/* Navbar is placed first inside Safe Area */}
            <Navbar />

            {/* Container for everything else */}
            <View className="flex-1 bg-white px-5 pt-5">
                {/* Header & Create Button Section */}
                <View className="mb-5 flex-row items-center justify-between">
                    <View className="flex-1 pr-2">
                        <Text className="text-2xl font-extrabold text-gray-900">
                            Table <Text className="text-orange-500">Management</Text>
                        </Text>
                        <Text className="mt-0.5 text-xs text-gray-500">
                            {tables.length} {tables.length === 1 ? "Table" : "Tables"} available
                        </Text>
                    </View>

                    {/* Create Table Button */}
                    <TouchableOpacity
                        className="flex-row items-center rounded-xl bg-orange-500 px-4 py-3 shadow-md active:bg-orange-600"
                        onPress={() => router.push("/admin/table/add")}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                        <Text className="ml-1.5 text-sm font-bold text-white">
                            Create Table
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Main Content View */}
                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#F97316" />
                        <Text className="mt-3 text-sm font-medium text-gray-500">
                            Loading tables...
                        </Text>
                    </View>
                ) : tables.length === 0 ? (
                    /* Empty State Container */
                    <View className="flex-1 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 px-5 py-12 mb-6">
                        <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/20">
                            <Ionicons name="grid-outline" size={32} color="#F97316" />
                        </View>

                        <Text className="mb-1 text-lg font-bold text-gray-900">
                            No Tables Found
                        </Text>

                        <Text className="mb-6 text-center text-xs leading-5 text-gray-500">
                            Start by creating tables to set up your restaurant seating.
                        </Text>

                        <TouchableOpacity
                            className="w-full flex-row items-center justify-center rounded-xl bg-orange-500 px-5 py-3.5"
                            onPress={() => router.push("/admin/table/add")}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                            <Text className="ml-2 text-sm font-bold text-white">
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
                                tintColor="#F97316"
                                colors={["#F97316"]}
                            />
                        }
                    />
                )}
            </View>

            {/* Toast Component placed at the absolute bottom of SafeAreaView with high rendering priority */}
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