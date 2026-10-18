import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Navbar from "../../../components/Navbar";
import Toast from "../../../components/Toast";

const ORDER_STATUSES = ["Pending", "Preparing", "Ready", "Completed", "Cancelled"];

const OrderDetails = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const orderId = Array.isArray(id) ? id[0] : id;

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
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

    const fetchOrder = async () => {
        try {
            setLoading(true);

            const token = await AsyncStorage.getItem("token");
            const url = process.env.EXPO_PUBLIC_GET_ORDER_BY_ID_URL;

            if (!url) {
                throw new Error("Order details API URL is missing from .env");
            }

            const response = await axios.get(
                `${url.replace(/\/+$/, "")}/${orderId}`,
                {
                    headers: {
                        Accept: "application/json",
                        ...(token && { Authorization: `Bearer ${token}` }),
                    },
                    withCredentials: true,
                }
            );

            setOrder(response.data.order);
        } catch (error) {
            console.log(
                "Fetch order error:",
                error.response?.data || error.message
            );

            setOrder(null);
            showToast(
                "error",
                error.response?.data?.message || "Failed to fetch order details"
            );
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOrder();
        }, [orderId])
    );

    const updateStatus = async (orderStatus) => {
        if (!order || updating || order.orderStatus === orderStatus) {
            return;
        }

        try {
            setUpdating(true);

            const token = await AsyncStorage.getItem("token");
            const url = process.env.EXPO_PUBLIC_UPDATE_ORDER_STATUS_URL;

            if (!url) {
                throw new Error("Order status API URL is missing from .env");
            }

            const response = await axios.put(
                `${url.replace(/\/+$/, "")}/${order._id}`,
                { orderStatus },
                {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` }),
                    },
                    withCredentials: true,
                }
            );

            setOrder((prev) => ({
                ...prev,
                ...response.data.order,
                user: prev.user,
                orderItems: prev.orderItems,
            }));

            showToast("success", "Order status updated successfully");
        } catch (error) {
            console.log(
                "Update order status error:",
                error.response?.data || error.message
            );

            showToast(
                "error",
                error.response?.data?.message || "Failed to update order status"
            );
        } finally {
            setUpdating(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Completed":
                return "#16A34A";
            case "Preparing":
                return "#2563EB";
            case "Ready":
                return "#7C3AED";
            case "Cancelled":
                return "#DC2626";
            default:
                return "#D97706";
        }
    };

    const formatDate = (date) => {
        if (!date) return "N/A";
        const parsedDate = new Date(date);
        return Number.isNaN(parsedDate.getTime()) ? "N/A" : parsedDate.toLocaleString();
    };

    const orderItems = order?.orderItems || [];
    const customer = order?.user;

    return (
        <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={["top"]}>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />

            <View className="bg-white pb-2 pt-1 border-b border-[#F1F5F9]">
                <Navbar />
            </View>

            <Toast
                visible={toast.visible}
                type={toast.type}
                message={toast.message}
                onHide={hideToast}
            />

            <View className="flex-1 bg-[#F8FAFC]">
                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#2563EB" />
                        <Text className="mt-3 text-xs font-bold text-[#64748B]">
                            Loading order details...
                        </Text>
                    </View>
                ) : !order ? (
                    <View className="flex-1 items-center justify-center p-6">
                        <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl border border-red-100 bg-red-50">
                            <Ionicons name="receipt-outline" size={36} color="#DC2626" />
                        </View>
                        <Text className="text-base font-extrabold text-[#0F172A]">
                            Order Not Found
                        </Text>
                        <Text className="mt-1 text-center text-xs text-[#64748B]">
                            This order could not be loaded or you are not authorized to view it.
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="mt-6 flex-row items-center rounded-2xl bg-[#2563EB] px-6 py-3.5 shadow-sm"
                            activeOpacity={0.8}
                        >
                            <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
                            <Text className="ml-2 text-xs font-bold text-white">
                                Go Back
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                    >
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="mb-5 flex-row items-center self-start rounded-2xl border border-[#DBEAFE] bg-white px-4 py-2.5 shadow-sm"
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={18} color="#2563EB" />
                            <Text className="ml-2 text-xs font-bold text-[#2563EB]">
                                Back to Orders
                            </Text>
                        </TouchableOpacity>

                        {/* Order Number & Status Card */}
                        <View className="mb-4 rounded-3xl border border-[#DBEAFE] bg-white p-5 shadow-sm">
                            <View className="flex-row items-start justify-between">
                                <View className="flex-1 pr-3">
                                    <Text className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">
                                        Order Number
                                    </Text>
                                    <Text className="mt-1 text-lg font-black text-[#0F172A]">
                                        #{String(order._id).slice(-6).toUpperCase()}
                                    </Text>
                                </View>
                                <View className="rounded-2xl border border-[#DBEAFE] bg-[#EFF6FF] p-3">
                                    <Ionicons name="receipt-outline" size={24} color="#2563EB" />
                                </View>
                            </View>

                            <View className="my-4 h-px w-full bg-[#F1F5F9]" />

                            <Text className="text-xs font-bold text-[#64748B]">
                                Order Status
                            </Text>

                            <View
                                className="mt-2 self-start rounded-xl px-3 py-1.5"
                                style={{ backgroundColor: `${getStatusColor(order.orderStatus)}18` }}
                            >
                                <Text
                                    className="text-xs font-extrabold"
                                    style={{ color: getStatusColor(order.orderStatus) }}
                                >
                                    {order.orderStatus || "Pending"}
                                </Text>
                            </View>

                            <Text className="mt-3 text-[10px] text-[#64748B]">
                                Order Date: {formatDate(order.createdAt)}
                            </Text>
                        </View>

                        {/* Customer Details Card */}
                        <View className="mb-4 rounded-3xl border border-[#DBEAFE] bg-white p-5 shadow-sm">
                            <View className="mb-4 flex-row items-center">
                                <Ionicons name="person-circle-outline" size={22} color="#2563EB" />
                                <Text className="ml-2 text-base font-black text-[#0F172A]">
                                    Customer Details
                                </Text>
                            </View>

                            <Text className="text-[10px] font-bold text-[#64748B]">Name</Text>
                            <Text className="mt-0.5 text-xs font-extrabold text-[#0F172A] mb-3">
                                {customer?.name || "N/A"}
                            </Text>

                            <Text className="text-[10px] font-bold text-[#64748B]">Email</Text>
                            <Text className="mt-0.5 text-xs font-extrabold text-[#0F172A] mb-3">
                                {customer?.email || "N/A"}
                            </Text>

                            <Text className="text-[10px] font-bold text-[#64748B]">Delivery Address</Text>
                            <Text className="mt-0.5 text-xs font-medium text-[#0F172A] leading-relaxed">
                                {order.deliveryAddress || "No address provided"}
                            </Text>
                        </View>

                        {/* Ordered Products Card */}
                        <View className="mb-4 rounded-3xl border border-[#DBEAFE] bg-white p-5 shadow-sm">
                            <View className="mb-4 flex-row items-center">
                                <Ionicons name="fast-food-outline" size={22} color="#2563EB" />
                                <Text className="ml-2 text-base font-black text-[#0F172A]">
                                    Ordered Products
                                </Text>
                            </View>

                            {orderItems.length === 0 ? (
                                <Text className="text-xs text-[#64748B]">No products found.</Text>
                            ) : (
                                orderItems.map((item, index) => {
                                    const menuItem = item.menuItem;
                                    const quantity = Number(item.quantity) || 0;
                                    const price = Number(item.price) || 0;

                                    return (
                                        <View
                                            key={item._id || `${order._id}-${index}`}
                                            className={`py-3.5 ${index > 0 ? "border-t border-[#F1F5F9]" : ""}`}
                                        >
                                            <Text className="text-xs font-bold text-[#0F172A]">
                                                {menuItem?.name || "Unavailable product"}
                                            </Text>
                                            <View className="mt-1 flex-row items-center justify-between">
                                                <Text className="text-[10px] text-[#64748B]">
                                                    Rs. {price.toLocaleString()} × {quantity}
                                                </Text>
                                                <Text className="text-xs font-black text-[#2563EB]">
                                                    Rs. {(price * quantity).toLocaleString()}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })
                            )}

                            <View className="mt-4 flex-row items-center justify-between border-t border-[#F1F5F9] pt-4">
                                <Text className="text-xs font-black text-[#0F172A]">
                                    Total Amount
                                </Text>
                                <Text className="text-base font-black text-[#2563EB]">
                                    Rs. {(Number(order.totalAmount) || 0).toLocaleString()}
                                </Text>
                            </View>
                        </View>

                        {/* Payment Details Card */}
                        <View className="mb-4 rounded-3xl border border-[#DBEAFE] bg-white p-5 shadow-sm">
                            <View className="mb-4 flex-row items-center">
                                <Ionicons name="card-outline" size={22} color="#2563EB" />
                                <Text className="ml-2 text-base font-black text-[#0F172A]">
                                    Payment Details
                                </Text>
                            </View>

                            <View className="mb-3 flex-row items-center justify-between">
                                <Text className="text-xs text-[#64748B]">Payment Method</Text>
                                <Text className="text-xs font-bold text-[#0F172A]">
                                    {order.paymentMethod || "N/A"}
                                </Text>
                            </View>

                            <View className="flex-row items-center justify-between">
                                <Text className="text-xs text-[#64748B]">Payment Status</Text>
                                <Text
                                    className={`text-xs font-bold ${
                                        order.paymentStatus === "Paid"
                                            ? "text-emerald-600"
                                            : order.paymentStatus === "Failed"
                                            ? "text-red-600"
                                            : "text-amber-600"
                                    }`}
                                >
                                    {order.paymentStatus || "Pending"}
                                </Text>
                            </View>
                        </View>

                        {/* Update Status Card */}
                        <View className="rounded-3xl border border-[#DBEAFE] bg-white p-5 shadow-sm">
                            <View className="mb-2 flex-row items-center">
                                <Ionicons name="sync-outline" size={22} color="#2563EB" />
                                <Text className="ml-2 text-base font-black text-[#0F172A]">
                                    Update Order Status
                                </Text>
                            </View>

                            <Text className="mb-4 text-[10px] text-[#64748B]">
                                Only managers can update order status.
                            </Text>

                            {ORDER_STATUSES.map((status) => {
                                const selected = order.orderStatus === status;

                                return (
                                    <TouchableOpacity
                                        key={status}
                                        disabled={updating || selected}
                                        onPress={() => updateStatus(status)}
                                        activeOpacity={0.8}
                                        className={`mt-2.5 flex-row items-center justify-between rounded-2xl border p-3.5 ${
                                            selected
                                                ? "border-[#2563EB] bg-[#EFF6FF]"
                                                : "border-[#DBEAFE] bg-white"
                                        } ${updating && !selected ? "opacity-50" : "opacity-100"}`}
                                    >
                                        <View className="flex-row items-center">
                                            <View
                                                className="mr-3 h-2.5 w-2.5 rounded-full"
                                                style={{ backgroundColor: getStatusColor(status) }}
                                            />
                                            <Text
                                                className={`text-xs font-bold ${
                                                    selected ? "text-[#2563EB]" : "text-[#0F172A]"
                                                }`}
                                            >
                                                {status}
                                            </Text>
                                        </View>
                                        {selected && (
                                            <Ionicons name="checkmark-circle" size={18} color="#2563EB" />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
};

export default OrderDetails;