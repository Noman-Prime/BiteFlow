
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Navbar from "../../components/Navbar";
import Toast from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";

const ORDERS_API_URL =
    process.env.EXPO_PUBLIC_API_MY_ORDERS_URL ||
    "https://mad-zwov.onrender.com/api/v1/my/orders";

const OrderHistory = () => {
    const router = useRouter();
    const { token, isAuthenticated } = useAuth();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
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
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const savedToken =
                token || (await AsyncStorage.getItem("token"));

            if (!savedToken) {
                setOrders([]);
                setError("Please sign in to view your order history.");
                return;
            }

            const response = await fetch(ORDERS_API_URL, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${savedToken}`,
                },
            });

            const contentType = response.headers.get("content-type") || "";
            const responseText = await response.text();

            let data = {};

            if (responseText) {
                try {
                    data = JSON.parse(responseText);
                } catch {
                    throw new Error(
                        response.ok
                            ? "The server returned an invalid response."
                            : `Server error (${response.status}). Please try again later.`
                    );
                }
            }

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error(
                        "Your session may have expired. Please sign in again."
                    );
                }

                throw new Error(
                    data.message ||
                        `Unable to fetch orders (${response.status}).`
                );
            }

            if (
                contentType &&
                !contentType.toLowerCase().includes("application/json")
            ) {
                throw new Error(
                    "The server did not return JSON. Please check your backend API."
                );
            }

            const fetchedOrders = Array.isArray(data)
                ? data
                : Array.isArray(data.orders)
                  ? data.orders
                  : Array.isArray(data.data)
                    ? data.data
                    : Array.isArray(data.data?.orders)
                      ? data.data.orders
                      : null;

            if (!fetchedOrders) {
                throw new Error(
                    data.message ||
                        "Unexpected order data received from the server."
                );
            }

            const historyOrders = fetchedOrders.filter((order) => {
                const status = String(
                    order.orderStatus || order.status || ""
                )
                    .trim()
                    .toLowerCase();

                return ["completed", "cancelled", "canceled"].includes(status);
            });

            setOrders(historyOrders);

            if (isRefresh) {
                showToast("success", "Order history updated.");
            }
        } catch (err) {
            console.error("Error fetching order history:", err);
            setError(err.message || "Unable to load your order history.");

            if (isRefresh) {
                showToast(
                    "error",
                    err.message || "Unable to refresh orders."
                );
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const formatDate = (dateString) => {
        if (!dateString) return "Date unavailable";

        const parsedDate = new Date(dateString);

        if (Number.isNaN(parsedDate.getTime())) {
            return String(dateString);
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

    const getOrderStatus = (item) =>
        item.orderStatus || item.status || "Unknown";

    const getStatusStyle = (status) => {
        const normalizedStatus = String(status).trim().toLowerCase();

        if (normalizedStatus === "completed") {
            return {
                container: "bg-emerald-50 border-emerald-100",
                text: "text-emerald-700",
                icon: "#059669",
                iconName: "checkmark-circle-outline",
            };
        }

        return {
            container: "bg-red-50 border-red-100",
            text: "text-red-600",
            icon: "#DC2626",
            iconName: "close-circle-outline",
        };
    };

    const getOrderItems = (item) => {
        if (Array.isArray(item.orderItems)) return item.orderItems;
        if (Array.isArray(item.items)) return item.items;
        return [];
    };

    const renderOrderItem = ({ item }) => {
        const status = getOrderStatus(item);
        const statusStyle = getStatusStyle(status);
        const orderItems = getOrderItems(item);
        const total =
            item.totalAmount ??
            item.totalPrice ??
            item.total ??
            item.amount ??
            0;
        const orderId = item._id || item.id;

        return (
            <View className="mb-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                <View className="mb-3 flex-row items-center justify-between border-b border-gray-100 pb-3">
                    <View className="flex-1 pr-3">
                        <Text className="text-sm font-black text-black">
                            {orderId
                                ? `Order #${String(orderId).slice(-6).toUpperCase()}`
                                : "Order"}
                        </Text>

                        <Text className="mt-1 text-[10px] font-medium text-gray-400">
                            {formatDate(
                                item.createdAt || item.date || item.orderDate
                            )}
                        </Text>
                    </View>

                    <View
                        className={`flex-row items-center rounded-xl border px-2.5 py-1.5 ${statusStyle.container}`}
                    >
                        <Ionicons
                            name={statusStyle.iconName}
                            size={13}
                            color={statusStyle.icon}
                        />
                        <Text
                            className={`ml-1 text-[10px] font-extrabold uppercase ${statusStyle.text}`}
                        >
                            {status}
                        </Text>
                    </View>
                </View>

                <View className="mb-3">
                    <Text className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                        Order Items
                    </Text>

                    {orderItems.length > 0 ? (
                        orderItems.map((subItem, index) => {
                            const menuItem =
                                typeof subItem.menuItem === "object"
                                    ? subItem.menuItem
                                    : null;

                            const name =
                                menuItem?.name ||
                                subItem.product?.name ||
                                subItem.name ||
                                "Item";

                            return (
                                <View
                                    key={
                                        subItem._id ||
                                        menuItem?._id ||
                                        index
                                    }
                                    className="flex-row items-start justify-between py-1"
                                >
                                    <Text className="flex-1 pr-3 text-xs font-semibold text-gray-600">
                                        {name}
                                    </Text>

                                    <Text className="text-xs font-bold text-gray-400">
                                        x{subItem.quantity ?? subItem.qty ?? 1}
                                    </Text>
                                </View>
                            );
                        })
                    ) : (
                        <Text className="text-xs text-gray-500">
                            Order details unavailable
                        </Text>
                    )}
                </View>

                <View className="mb-3 flex-row items-center justify-between border-t border-gray-100 pt-3">
                    <View className="flex-row items-center">
                        <Ionicons
                            name="card-outline"
                            size={15}
                            color="#9CA3AF"
                        />
                        <Text className="ml-2 text-xs font-semibold text-gray-500">
                            {item.paymentMethod || "Payment method unavailable"}
                        </Text>
                    </View>

                    {item.paymentStatus ? (
                        <Text className="text-[10px] font-bold text-gray-500">
                            Payment: {item.paymentStatus}
                        </Text>
                    ) : null}
                </View>

                <View className="flex-row items-center justify-between rounded-2xl bg-orange-50 px-3 py-3">
                    <Text className="text-xs font-bold text-gray-600">
                        Order Total
                    </Text>

                    <Text className="text-base font-black text-orange-600">
                        Rs. {formatAmount(total)}
                    </Text>
                </View>
            </View>
        );
    };

    const renderEmptyOrders = () => (
        <View className="flex-1 items-center justify-center px-8 py-16">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl border border-emerald-100 bg-emerald-50">
                <Ionicons
                    name="receipt-outline"
                    size={36}
                    color="#10B981"
                />
            </View>

            <Text className="text-lg font-extrabold text-black">
                No Order History Yet
            </Text>

            <Text className="mt-2 text-center text-xs leading-5 text-gray-500">
                Completed and cancelled orders will appear here. You can track
                ongoing orders from the Orders tab.
            </Text>

            <TouchableOpacity
                onPress={() => router.replace("/")}
                activeOpacity={0.8}
                className="mt-6 flex-row items-center rounded-2xl bg-black px-6 py-3.5"
            >
                <Ionicons
                    name="restaurant-outline"
                    size={17}
                    color="#FFFFFF"
                />
                <Text className="ml-2 text-xs font-bold text-white">
                    Explore Menu
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderError = () => (
        <View className="flex-1 items-center justify-center px-8 py-12">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl border border-red-100 bg-red-50">
                <Ionicons
                    name="alert-circle-outline"
                    size={32}
                    color="#DC2626"
                />
            </View>

            <Text className="text-base font-extrabold text-black">
                Unable to Load Order History
            </Text>

            <Text className="mt-2 text-center text-xs leading-5 text-gray-500">
                {error}
            </Text>

            <TouchableOpacity
                onPress={() => fetchOrders()}
                activeOpacity={0.8}
                className="mt-5 flex-row items-center rounded-2xl bg-black px-6 py-3.5"
            >
                <Ionicons name="refresh" size={16} color="#FFFFFF" />
                <Text className="ml-2 text-xs font-bold text-white">
                    Try Again
                </Text>
            </TouchableOpacity>

            {(error.toLowerCase().includes("sign in") ||
                error.toLowerCase().includes("session")) && (
                <TouchableOpacity
                    onPress={() => router.replace("/signin")}
                    activeOpacity={0.8}
                    className="mt-3 rounded-2xl border border-gray-200 px-6 py-3"
                >
                    <Text className="text-xs font-bold text-black">
                        Go to Sign In
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView
            className="flex-1 bg-gray-50"
            edges={["top", "left", "right"]}
        >
            <StatusBar style="light" backgroundColor="#000000" />

            <Navbar />

            <View className="flex-row items-center justify-between bg-black px-5 pb-5 pt-2">
                <TouchableOpacity
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                    className="h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10"
                >
                    <Ionicons
                        name="arrow-back"
                        size={21}
                        color="#FFFFFF"
                    />
                </TouchableOpacity>

                <View className="flex-1 items-center">
                    <Text className="text-base font-black text-white">
                        Order History
                    </Text>
                    <Text className="mt-0.5 text-[10px] font-medium text-gray-400">
                        Completed & cancelled orders
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={() => fetchOrders(true)}
                    disabled={loading || refreshing}
                    activeOpacity={0.7}
                    className="h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10"
                >
                    <Ionicons
                        name="refresh"
                        size={20}
                        color="#FFFFFF"
                    />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center p-6">
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text className="mt-3 text-xs font-bold text-gray-500">
                        Loading order history...
                    </Text>
                </View>
            ) : error ? (
                renderError()
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item, index) =>
                        String(item._id || item.id || index)
                    }
                    renderItem={renderOrderItem}
                    ListHeaderComponent={
                        orders.length > 0 ? (
                            <View className="mb-4 flex-row items-center justify-between">
                                <View>
                                    <Text className="text-lg font-black text-black">
                                        Previous Orders
                                    </Text>
                                    <Text className="mt-1 text-xs text-gray-500">
                                        Your completed and cancelled orders
                                    </Text>
                                </View>

                                <View className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                                    <Text className="text-xs font-extrabold text-emerald-700">
                                        {orders.length}{" "}
                                        {orders.length === 1
                                            ? "Order"
                                            : "Orders"}
                                    </Text>
                                </View>
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={renderEmptyOrders}
                    contentContainerStyle={{
                        paddingHorizontal: 20,
                        paddingTop: 20,
                        paddingBottom: 40,
                        flexGrow: 1,
                    }}
                    showsVerticalScrollIndicator={false}
                    onRefresh={() => fetchOrders(true)}
                    refreshing={refreshing}
                />
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

export default OrderHistory;
