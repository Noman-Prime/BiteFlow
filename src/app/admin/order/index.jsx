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

const OrderList = () => {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
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

    const getStatusStyle = (status) => {
        switch (status) {
            case "Preparing":
                return {
                    backgroundColor: "#EFF6FF",
                    borderColor: "#DBEAFE",
                    color: "#2563EB",
                };
            case "Ready":
                return {
                    backgroundColor: "#F5F3FF",
                    borderColor: "#DDD6FE",
                    color: "#7C3AED",
                };
            case "Completed":
                return {
                    backgroundColor: "#F0FDF4",
                    borderColor: "#DCFCE7",
                    color: "#16A34A",
                };
            case "Cancelled":
                return {
                    backgroundColor: "#FEF2F2",
                    borderColor: "#FEE2E2",
                    color: "#DC2626",
                };
            default:
                return {
                    backgroundColor: "#EFF6FF",
                    borderColor: "#DBEAFE",
                    color: "#2563EB",
                };
        }
    };

    const fetchOrders = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const url = process.env.EXPO_PUBLIC_GET_ALL_ORDERS_URL;

            if (!url) {
                throw new Error("EXPO_PUBLIC_GET_ALL_ORDERS_URL is missing in .env.");
            }

            const response = await axios.get(url, {
                headers: {
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                withCredentials: true,
            });

            setOrders(response.data.orders || []);
        } catch (error) {
            console.log("Fetch orders error:", error.response?.data || error.message);

            showToast(
                "error",
                error.response?.data?.message || error.message || "Failed to load orders."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchOrders();
        }, [fetchOrders])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const renderOrder = ({ item }) => {
        const orderId = item._id || item.id;
        const orderItems = item.orderItems || [];
        const status = item.orderStatus || "Pending";
        const statusStyle = getStatusStyle(status);

        return (
            <TouchableOpacity
                onPress={() => {
                    if (orderId) {
                        router.push(`/admin/order/${orderId}`);
                    } else {
                        showToast("error", "Invalid order ID.");
                    }
                }}
                activeOpacity={0.8}
                className="mb-3.5 flex-row items-center justify-between rounded-3xl border border-[#DBEAFE] bg-white p-4 shadow-sm"
            >
                <View className="mr-3 h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE]">
                    <Ionicons name="receipt-outline" size={22} color="#2563EB" />
                </View>

                <View className="flex-1 pr-2">
                    <Text className="text-xs font-black text-[#0F172A]">
                        Order #{String(orderId || "").slice(-6).toUpperCase()}
                    </Text>

                    <Text className="mt-1 text-xs text-[#64748B]">
                        {orderItems.length} {orderItems.length === 1 ? "Product" : "Products"}
                        {" · "}Rs. {(Number(item.totalAmount) || 0).toLocaleString()}
                    </Text>

                    <Text className="mt-0.5 text-[10px] font-medium text-[#64748B]">
                        {item.paymentMethod || "Payment not specified"}
                    </Text>
                </View>

                <View className="items-end">
                    <View
                        style={{
                            backgroundColor: statusStyle.backgroundColor,
                            borderColor: statusStyle.borderColor,
                        }}
                        className="rounded-xl border px-3 py-1"
                    >
                        <Text
                            style={{ color: statusStyle.color }}
                            className="text-[10px] font-extrabold uppercase"
                        >
                            {status}
                        </Text>
                    </View>

                    <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#94A3B8"
                        style={{ marginTop: 8 }}
                    />
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
                <View className="mb-4">
                    <Text className="text-xl font-black text-[#0F172A]">
                        Order Management
                    </Text>

                    <Text className="mt-0.5 text-xs text-[#64748B]">
                        {orders.length} {orders.length === 1 ? "Order" : "Orders"} found
                    </Text>

                    <View className="mt-4 flex-row items-center rounded-3xl border border-[#DBEAFE] bg-white p-4 shadow-sm">
                        <View className="mr-3 h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE]">
                            <Ionicons name="receipt-outline" size={24} color="#2563EB" />
                        </View>

                        <View>
                            <Text className="text-[10px] font-bold text-[#64748B]">
                                Total Orders
                            </Text>

                            <Text className="mt-0.5 text-xl font-black text-[#0F172A]">
                                {orders.length}
                            </Text>
                        </View>
                    </View>
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#2563EB" />
                        <Text className="mt-3 text-xs font-bold text-[#64748B]">
                            Loading orders...
                        </Text>
                    </View>
                ) : orders.length === 0 ? (
                    <View className="mb-6 flex-1 items-center justify-center rounded-3xl border border-[#DBEAFE] bg-white px-5 py-12 shadow-sm">
                        <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl border border-[#DBEAFE] bg-[#EFF6FF]">
                            <Ionicons name="receipt-outline" size={36} color="#2563EB" />
                        </View>

                        <Text className="mb-1 text-base font-extrabold text-[#0F172A]">
                            No Orders Found
                        </Text>

                        <Text className="text-center text-xs text-[#64748B]">
                            Customer orders will appear here when they place an order.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={orders}
                        keyExtractor={(item, index) =>
                            item._id ? item._id.toString() : index.toString()
                        }
                        renderItem={renderOrder}
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

export default OrderList;