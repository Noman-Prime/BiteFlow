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
                    container: "bg-[#EFF6FF] border-[#DBEAFE]",
                    text: "text-[#2563EB]",
                    icon: "restaurant-outline",
                    color: "#2563EB",
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
        <View className="bg-white px-5 pt-2 pb-3 border-b border-[#F1F5F9]">
            <Text className="text-xl font-black text-[#0F172A]">
                My Orders
            </Text>

            <Text className="mt-0.5 text-xs text-[#64748B]">
                Track your orders currently in progress
            </Text>
        </View>
    );

    const renderEmptyState = () => (
        <View className="flex-1 items-center justify-center p-6">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl border border-[#DBEAFE] bg-[#EFF6FF]">
                <Ionicons
                    name={isLoggedIn ? "receipt-outline" : "person-outline"}
                    size={36}
                    color="#2563EB"
                />
            </View>

            <Text className="text-lg font-black text-[#0F172A]">
                {isLoggedIn ? "No Active Orders" : "Sign In to View Orders"}
            </Text>

            <Text className="mt-2 text-center text-xs leading-5 text-[#64748B]">
                {isLoggedIn
                    ? "You have no orders in progress. New orders will appear here after checkout."
                    : "Sign in to track your orders. You can add products to your cart before signing in."}
            </Text>

            <TouchableOpacity
                onPress={() =>
                    router.push(isLoggedIn ? "/(tabs)" : "/signin")
                }
                className="mt-6 rounded-2xl bg-[#2563EB] px-6 py-3.5 shadow-sm"
                activeOpacity={0.8}
            >
                <Text className="text-xs font-bold text-white">
                    {isLoggedIn ? "Start Ordering" : "Sign In"}
                </Text>
            </TouchableOpacity>

            {isLoggedIn && (
                <TouchableOpacity
                    onPress={() => router.push("/account/orders")}
                    className="mt-3 rounded-2xl border border-[#DBEAFE] bg-white px-6 py-3"
                    activeOpacity={0.8}
                >
                    <Text className="text-xs font-bold text-[#0F172A]">
                        View Order History
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView
            className="flex-1 bg-[#F8FAFC]"
            edges={["top", "left", "right"]}
        >
            {renderHeader()}

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text className="mt-3 text-xs font-bold text-[#64748B]">
                        Loading your active orders...
                    </Text>
                </View>
            ) : error && orders.length === 0 && isLoggedIn ? (
                <View className="flex-1 items-center justify-center p-6">
                    <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl border border-red-100 bg-red-50">
                        <Ionicons
                            name="alert-circle-outline"
                            size={32}
                            color="#DC2626"
                        />
                    </View>

                    <Text className="text-base font-extrabold text-[#0F172A]">
                        Unable to Load Orders
                    </Text>

                    <Text className="mt-2 text-center text-xs leading-5 text-[#64748B]">
                        {error}
                    </Text>

                    <TouchableOpacity
                        onPress={() =>
                            error.toLowerCase().includes("sign in")
                                ? router.push("/signin")
                                : fetchOrders()
                        }
                        className="mt-5 rounded-2xl bg-[#2563EB] px-6 py-3.5 shadow-sm"
                        activeOpacity={0.8}
                    >
                        <Text className="text-xs font-bold text-white">
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
                            tintColor="#2563EB"
                            colors={["#2563EB"]}
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
                            tintColor="#2563EB"
                            colors={["#2563EB"]}
                        />
                    }
                >
                    {error ? (
                        <TouchableOpacity
                            onPress={() => fetchOrders(true)}
                            className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4"
                            activeOpacity={0.8}
                        >
                            <Text className="text-xs font-semibold text-red-600">
                                {error} Tap to retry.
                            </Text>
                        </TouchableOpacity>
                    ) : null}

                    <View className="mb-4 flex-row items-center justify-between">
                        <View>
                            <Text className="text-lg font-black text-[#0F172A]">
                                In Progress
                            </Text>
                            <Text className="mt-0.5 text-xs text-[#64748B]">
                                Follow your order status
                            </Text>
                        </View>

                        <View className="rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] px-3 py-2">
                            <Text className="text-xs font-extrabold text-[#2563EB]">
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
                                className="mb-4 rounded-3xl border border-[#DBEAFE] bg-white p-4 shadow-sm"
                            >
                                <View className="mb-3 flex-row items-center justify-between border-b border-[#F1F5F9] pb-3">
                                    <View className="flex-1 pr-2">
                                        <Text className="text-xs font-black text-[#0F172A]">
                                            Order #
                                            {String(orderId || "")
                                                .slice(-8)
                                                .toUpperCase()}
                                        </Text>

                                        <Text className="mt-1 text-[10px] font-medium text-[#64748B]">
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
                                            className={`ml-1 text-[10px] font-extrabold uppercase ${statusStyle.text}`}
                                        >
                                            {status}
                                        </Text>
                                    </View>
                                </View>

                                {orderItems.slice(0, 2).map((item, index) => (
                                    <Text
                                        key={item._id || `${orderId}-${index}`}
                                        className="mb-1 text-xs font-medium text-[#64748B]"
                                    >
                                        {item.menuItem?.name || "Menu item"} ×{" "}
                                        {item.quantity}
                                    </Text>
                                ))}

                                {orderItems.length > 2 && (
                                    <Text className="text-xs font-medium text-[#64748B]">
                                        +{orderItems.length - 2} more items
                                    </Text>
                                )}

                                <View className="mt-3 flex-row items-center justify-between border-t border-[#F1F5F9] pt-3">
                                    <View>
                                        <Text className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                                            Order Total
                                        </Text>

                                        <Text className="mt-0.5 text-sm font-black text-[#2563EB]">
                                            Rs. {formatAmount(order.totalAmount)}
                                        </Text>
                                    </View>

                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        className="flex-row items-center rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] px-3.5 py-2"
                                        onPress={() =>
                                            setExpandedOrder(
                                                isExpanded ? null : orderId
                                            )
                                        }
                                    >
                                        <Text className="text-[11px] font-extrabold text-[#2563EB]">
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
                                            color="#2563EB"
                                            style={{ marginLeft: 5 }}
                                        />
                                    </TouchableOpacity>
                                </View>

                                {isExpanded && (
                                    <View className="mt-4 border-t border-[#F1F5F9] pt-4">
                                        <Text className="mb-3 text-xs font-black uppercase tracking-wider text-[#0F172A]">
                                            Order Details
                                        </Text>

                                        {orderItems.length === 0 ? (
                                            <Text className="mb-3 text-xs text-[#64748B]">
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
                                                        <Text className="text-xs font-bold text-[#0F172A]">
                                                            {item.menuItem?.name ||
                                                                "Menu item"}
                                                        </Text>

                                                        <Text className="mt-0.5 text-[10px] font-medium text-[#64748B]">
                                                            Rs.{" "}
                                                            {formatAmount(item.price)}{" "}
                                                            × {item.quantity}
                                                        </Text>
                                                    </View>

                                                    <Text className="text-xs font-black text-[#0F172A]">
                                                        Rs.{" "}
                                                        {formatAmount(
                                                            Number(item.price) *
                                                                Number(item.quantity)
                                                        )}
                                                    </Text>
                                                </View>
                                            ))
                                        )}

                                        <View className="mt-1 border-t border-[#F1F5F9] pt-3">
                                            <Text className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                                                Payment Method
                                            </Text>

                                            <Text className="mt-0.5 text-xs font-bold text-[#0F172A]">
                                                {order.paymentMethod ||
                                                    "Not specified"}
                                            </Text>

                                            <Text className="mt-3 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                                                Payment Status
                                            </Text>

                                            <Text className="mt-0.5 text-xs font-bold text-[#0F172A]">
                                                {order.paymentStatus || "Pending"}
                                            </Text>

                                            <Text className="mt-3 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                                                Delivery Address
                                            </Text>

                                            <Text className="mt-0.5 text-xs leading-5 font-medium text-[#64748B]">
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