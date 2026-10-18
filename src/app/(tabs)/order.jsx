import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "../../components/Toast";

const ORDERS_URL = "https://mad-zwov.onrender.com/api/v1/my/orders";

const ACTIVE_STATUSES = ["pending", "preparing", "ready"];

const Orders = () => {
    const router = useRouter();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [expandedOrder, setExpandedOrder] = useState(null);
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

    const fetchOrders = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");

        try {
            const token = await AsyncStorage.getItem("token");

            if (!token) {
                setIsLoggedIn(false);
                setOrders([]);
                setExpandedOrder(null);
                return;
            }

            const response = await axios.get(ORDERS_URL, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                withCredentials: true,
            });

            setIsLoggedIn(true);

            const fetchedOrders =
                response.data?.orders ||
                response.data?.data?.orders ||
                [];

            if (!Array.isArray(fetchedOrders)) {
                throw new Error("Unexpected order data received.");
            }

            const activeOrders = fetchedOrders.filter((order) => {
                const status = String(
                    order.orderStatus || order.status || "Pending"
                )
                    .trim()
                    .toLowerCase();

                return ACTIVE_STATUSES.includes(status);
            });

            setOrders(activeOrders);

            setExpandedOrder((previousId) =>
                activeOrders.some(
                    (order) => (order._id || order.id) === previousId
                )
                    ? previousId
                    : null
            );
        } catch (err) {
            const message =
                err.response?.data?.message ||
                err.message ||
                "Unable to load your orders. Please try again.";

            if (
                err.response?.status === 401 ||
                err.response?.status === 403
            ) {
                setIsLoggedIn(false);
                setOrders([]);
                setExpandedOrder(null);
                setError("Please sign in again to view your orders.");
            } else {
                setError(message);
            }

            showToast("error", message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [fetchOrders])
    );

    const formatDate = (date) => {
        if (!date) return "Date unavailable";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "Date unavailable";
        }

        return parsedDate.toLocaleString("en-PK", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatAmount = (amount) => {
        const value = Number(amount);

        return Number.isFinite(value)
            ? value.toLocaleString("en-PK")
            : "0";
    };

    const getStatusStyle = (status) => {
        switch (String(status || "Pending").toLowerCase()) {
            case "pending":
                return {
                    container: "bg-amber-50 border-amber-100",
                    text: "text-amber-700",
                    icon: "time-outline",
                    color: "#D97706",
                };

            case "preparing":
                return {
                    container: "bg-orange-50 border-orange-100",
                    text: "text-orange-600",
                    icon: "restaurant-outline",
                    color: "#F97316",
                };

            case "ready":
                return {
                    container: "bg-blue-50 border-blue-100",
                    text: "text-blue-600",
                    icon: "checkmark-circle-outline",
                    color: "#2563EB",
                };

            default:
                return {
                    container: "bg-gray-100 border-gray-200",
                    text: "text-gray-600",
                    icon: "help-circle-outline",
                    color: "#6B7280",
                };
        }
    };

    const renderHeader = () => (
        <View className="bg-gray-900 px-5 py-4">
            <Text className="text-base font-extrabold text-white">
                My Orders
            </Text>

            <Text className="mt-0.5 text-[10px] font-semibold text-gray-400">
                Track your orders currently in progress
            </Text>
        </View>
    );

    const renderEmptyState = () => (
        <View className="flex-1 items-center justify-center p-6">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl border border-orange-100 bg-orange-50">
                <Ionicons
                    name={isLoggedIn ? "receipt-outline" : "person-outline"}
                    size={32}
                    color="#F97316"
                />
            </View>

            <Text className="text-base font-bold text-black">
                {isLoggedIn ? "No Active Orders" : "Sign In to View Orders"}
            </Text>

            <Text className="mt-1 text-center text-xs leading-5 text-gray-500">
                {isLoggedIn
                    ? "You have no orders in progress. New orders will appear here after checkout."
                    : "Sign in to track your orders. You can add products to your cart before signing in."}
            </Text>

            <TouchableOpacity
                onPress={() =>
                    router.push(isLoggedIn ? "/(tabs)" : "/signin")
                }
                className="mt-6 rounded-2xl bg-orange-500 px-6 py-3.5"
                activeOpacity={0.8}
            >
                <Text className="text-xs font-bold text-white">
                    {isLoggedIn ? "Start Ordering" : "Sign In"}
                </Text>
            </TouchableOpacity>

            {isLoggedIn && (
                <TouchableOpacity
                    onPress={() => router.push("/account/orders")}
                    className="mt-3 rounded-2xl border border-gray-200 px-6 py-3"
                    activeOpacity={0.8}
                >
                    <Text className="text-xs font-bold text-gray-700">
                        View Order History
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView
            className="flex-1 bg-white"
            edges={["top", "left", "right"]}
        >
            {renderHeader()}

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#F97316" />
                    <Text className="mt-3 text-sm text-gray-500">
                        Loading your active orders...
                    </Text>
                </View>
            ) : error && orders.length === 0 && isLoggedIn ? (
                <View className="flex-1 items-center justify-center p-6">
                    <Ionicons
                        name="alert-circle-outline"
                        size={48}
                        color="#EF4444"
                    />

                    <Text className="mt-3 text-center font-semibold text-gray-800">
                        {error}
                    </Text>

                    <TouchableOpacity
                        onPress={() =>
                            error.toLowerCase().includes("sign in")
                                ? router.push("/signin")
                                : fetchOrders()
                        }
                        className="mt-5 rounded-xl bg-orange-500 px-6 py-3"
                        activeOpacity={0.8}
                    >
                        <Text className="font-bold text-white">
                            {error.toLowerCase().includes("sign in")
                                ? "Sign In"
                                : "Try Again"}
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : orders.length === 0 ? (
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ flexGrow: 1 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => fetchOrders(true)}
                            tintColor="#F97316"
                        />
                    }
                >
                    {renderEmptyState()}
                </ScrollView>
            ) : (
                <ScrollView
                    className="flex-1 px-5 pt-4"
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => fetchOrders(true)}
                            tintColor="#F97316"
                        />
                    }
                >
                    {error ? (
                        <TouchableOpacity
                            onPress={() => fetchOrders(true)}
                            className="mb-4 rounded-xl bg-red-50 p-3"
                            activeOpacity={0.8}
                        >
                            <Text className="text-sm text-red-600">
                                {error} Tap to retry.
                            </Text>
                        </TouchableOpacity>
                    ) : null}

                    <View className="mb-4 flex-row items-center justify-between">
                        <View>
                            <Text className="text-lg font-black text-black">
                                In Progress
                            </Text>
                            <Text className="mt-1 text-xs text-gray-500">
                                Follow your order status
                            </Text>
                        </View>

                        <View className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-2">
                            <Text className="text-xs font-extrabold text-orange-600">
                                {orders.length}{" "}
                                {orders.length === 1 ? "Order" : "Orders"}
                            </Text>
                        </View>
                    </View>

                    {orders.map((order) => {
                        const status =
                            order.orderStatus || order.status || "Pending";
                        const statusStyle = getStatusStyle(status);
                        const orderId = order._id || order.id;
                        const isExpanded = expandedOrder === orderId;
                        const orderItems = Array.isArray(order.orderItems)
                            ? order.orderItems
                            : [];

                        return (
                            <View
                                key={orderId}
                                className="mb-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm"
                            >
                                <View className="mb-3 flex-row items-center justify-between border-b border-gray-100 pb-3">
                                    <View className="flex-1 pr-2">
                                        <Text className="text-xs font-bold text-black">
                                            Order #
                                            {String(orderId || "")
                                                .slice(-8)
                                                .toUpperCase()}
                                        </Text>

                                        <Text className="mt-1 text-[10px] text-gray-400">
                                            {formatDate(order.createdAt)}
                                        </Text>
                                    </View>

                                    <View
                                        className={`flex-row items-center rounded-xl border px-2.5 py-1.5 ${statusStyle.container}`}
                                    >
                                        <Ionicons
                                            name={statusStyle.icon}
                                            size={13}
                                            color={statusStyle.color}
                                        />

                                        <Text
                                            className={`ml-1 text-[10px] font-bold ${statusStyle.text}`}
                                        >
                                            {status}
                                        </Text>
                                    </View>
                                </View>

                                {orderItems.slice(0, 2).map((item, index) => (
                                    <Text
                                        key={item._id || `${orderId}-${index}`}
                                        className="mb-1 text-xs font-medium text-gray-700"
                                    >
                                        {item.menuItem?.name || "Menu item"} ×{" "}
                                        {item.quantity}
                                    </Text>
                                ))}

                                {orderItems.length > 2 && (
                                    <Text className="text-xs text-gray-400">
                                        +{orderItems.length - 2} more items
                                    </Text>
                                )}

                                <View className="mt-3 flex-row items-center justify-between border-t border-gray-100 pt-3">
                                    <View>
                                        <Text className="text-[10px] text-gray-400">
                                            Order Total
                                        </Text>

                                        <Text className="mt-1 text-sm font-extrabold text-orange-600">
                                            Rs. {formatAmount(order.totalAmount)}
                                        </Text>
                                    </View>

                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        className="flex-row items-center rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2"
                                        onPress={() =>
                                            setExpandedOrder(
                                                isExpanded ? null : orderId
                                            )
                                        }
                                    >
                                        <Text className="text-[11px] font-bold text-black">
                                            {isExpanded
                                                ? "Hide Details"
                                                : "View Details"}
                                        </Text>

                                        <Ionicons
                                            name={
                                                isExpanded
                                                    ? "chevron-up"
                                                    : "chevron-down"
                                            }
                                            size={15}
                                            color="#111827"
                                            style={{ marginLeft: 5 }}
                                        />
                                    </TouchableOpacity>
                                </View>

                                {isExpanded && (
                                    <View className="mt-4 border-t border-gray-100 pt-4">
                                        <Text className="mb-3 text-sm font-bold text-black">
                                            Order Details
                                        </Text>

                                        {orderItems.length === 0 ? (
                                            <Text className="mb-3 text-xs text-gray-500">
                                                No product details available.
                                            </Text>
                                        ) : (
                                            orderItems.map((item, index) => (
                                                <View
                                                    key={
                                                        item._id ||
                                                        `${orderId}-detail-${index}`
                                                    }
                                                    className="mb-3 flex-row justify-between"
                                                >
                                                    <View className="flex-1 pr-3">
                                                        <Text className="text-xs font-semibold text-gray-800">
                                                            {item.menuItem?.name ||
                                                                "Menu item"}
                                                        </Text>

                                                        <Text className="mt-1 text-[10px] text-gray-500">
                                                            Rs.{" "}
                                                            {formatAmount(item.price)}{" "}
                                                            × {item.quantity}
                                                        </Text>
                                                    </View>

                                                    <Text className="text-xs font-bold text-gray-800">
                                                        Rs.{" "}
                                                        {formatAmount(
                                                            Number(item.price) *
                                                                Number(item.quantity)
                                                        )}
                                                    </Text>
                                                </View>
                                            ))
                                        )}

                                        <View className="mt-1 border-t border-gray-100 pt-3">
                                            <Text className="text-xs text-gray-500">
                                                Payment Method
                                            </Text>

                                            <Text className="mt-1 text-xs font-semibold text-gray-800">
                                                {order.paymentMethod ||
                                                    "Not specified"}
                                            </Text>

                                            <Text className="mt-3 text-xs text-gray-500">
                                                Payment Status
                                            </Text>

                                            <Text className="mt-1 text-xs font-semibold text-gray-800">
                                                {order.paymentStatus || "Pending"}
                                            </Text>

                                            <Text className="mt-3 text-xs text-gray-500">
                                                Delivery Address
                                            </Text>

                                            <Text className="mt-1 text-xs leading-5 text-gray-800">
                                                {order.deliveryAddress ||
                                                    "Not available"}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </ScrollView>
            )}

            <Toast
                visible={toast.visible}
                type={toast.type}
                message={toast.message}
                onHide={hideToast}
            />
        </SafeAreaView>
    );
};

export default Orders;