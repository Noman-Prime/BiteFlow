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
                    borderColor: "#BFDBFE",
                    color: "#1D4ED8",
                };
            case "Ready":
                return {
                    backgroundColor: "#F5F3FF",
                    borderColor: "#DDD6FE",
                    color: "#6D28D9",
                };
            case "Completed":
                return {
                    backgroundColor: "#ECFDF5",
                    borderColor: "#A7F3D0",
                    color: "#047857",
                };
            case "Cancelled":
                return {
                    backgroundColor: "#FEF2F2",
                    borderColor: "#FECACA",
                    color: "#B91C1C",
                };
            default:
                return {
                    backgroundColor: "#FFF7ED",
                    borderColor: "#FED7AA",
                    color: "#C2410C",
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
                className="mb-3 flex-row items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
                <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                    <Ionicons name="receipt-outline" size={22} color="#F97316" />
                </View>

                <View className="flex-1 pr-2">
                    <Text className="text-base font-extrabold text-gray-900">
                        Order #{String(orderId || "").slice(-6).toUpperCase()}
                    </Text>

                    <Text className="mt-0.5 text-xs font-semibold text-gray-500">
                        {orderItems.length} {orderItems.length === 1 ? "Product" : "Products"}
                        {" · "}Rs. {(Number(item.totalAmount) || 0).toLocaleString()}
                    </Text>

                    <Text className="mt-1 text-xs text-gray-500">
                        {item.paymentMethod || "Payment not specified"}
                    </Text>
                </View>

                <View className="items-end">
                    <View
                        style={{
                            backgroundColor: statusStyle.backgroundColor,
                            borderColor: statusStyle.borderColor,
                        }}
                        className="rounded-xl border px-3 py-1.5"
                    >
                        <Text
                            style={{ color: statusStyle.color }}
                            className="text-xs font-bold"
                        >
                            {status}
                        </Text>
                    </View>

                    <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#9CA3AF"
                        style={{ marginTop: 8 }}
                    />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />

            <Navbar />

            <View className="flex-1 bg-white px-5 pt-5">
                <View className="mb-5">
                    <Text className="text-2xl font-extrabold text-gray-900">
                        Order <Text className="text-orange-500">Management</Text>
                    </Text>

                    <Text className="mt-0.5 text-xs text-gray-500">
                        {orders.length} {orders.length === 1 ? "Order" : "Orders"} found
                    </Text>

                    <View className="mt-4 flex-row items-center rounded-2xl border border-gray-100 bg-gray-50 p-4">
                        <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                            <Ionicons name="receipt-outline" size={25} color="#F97316" />
                        </View>

                        <View>
                            <Text className="text-xs font-semibold text-gray-500">
                                Total Orders
                            </Text>

                            <Text className="mt-0.5 text-2xl font-extrabold text-gray-900">
                                {orders.length}
                            </Text>
                        </View>
                    </View>
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#F97316" />

                        <Text className="mt-3 text-sm font-medium text-gray-500">
                            Loading orders...
                        </Text>
                    </View>
                ) : orders.length === 0 ? (
                    <View className="mb-6 flex-1 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 px-5 py-12">
                        <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50">
                            <Ionicons name="receipt-outline" size={32} color="#F97316" />
                        </View>

                        <Text className="mb-1 text-lg font-bold text-gray-900">
                            No Orders Found
                        </Text>

                        <Text className="text-center text-xs leading-5 text-gray-500">
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
                                tintColor="#F97316"
                                colors={["#F97316"]}
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