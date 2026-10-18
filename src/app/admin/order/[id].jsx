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

        return Number.isNaN(parsedDate.getTime())
            ? "N/A"
            : parsedDate.toLocaleString();
    };

    const orderItems = order?.orderItems || [];
    const customer = order?.user;

    return (
        <SafeAreaView
            style={{ flex: 1, backgroundColor: "#111827" }}
            edges={["top", "left", "right"]}
        >
            <StatusBar style="light" />
            <Navbar />

            <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
                {loading ? (
                    <View
                        style={{
                            flex: 1,
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <ActivityIndicator size="large" color="#F97316" />
                        <Text style={{ color: "#6B7280", marginTop: 12 }}>
                            Loading order details...
                        </Text>
                    </View>
                ) : !order ? (
                    <View
                        style={{
                            flex: 1,
                            justifyContent: "center",
                            alignItems: "center",
                            padding: 24,
                        }}
                    >
                        <Ionicons
                            name="receipt-outline"
                            size={64}
                            color="#9CA3AF"
                        />
                        <Text
                            style={{
                                color: "#111827",
                                fontSize: 20,
                                fontWeight: "bold",
                                marginTop: 16,
                            }}
                        >
                            Order Not Found
                        </Text>
                        <Text
                            style={{
                                color: "#6B7280",
                                fontSize: 14,
                                textAlign: "center",
                                marginTop: 8,
                            }}
                        >
                            This order could not be loaded or you are not
                            authorized to view it.
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                backgroundColor: "#F97316",
                                paddingHorizontal: 20,
                                paddingVertical: 13,
                                borderRadius: 10,
                                marginTop: 22,
                            }}
                        >
                            <Ionicons
                                name="arrow-back"
                                size={18}
                                color="#FFFFFF"
                            />
                            <Text
                                style={{
                                    color: "#FFFFFF",
                                    fontWeight: "bold",
                                    marginLeft: 8,
                                }}
                            >
                                Go Back
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{
                            padding: 18,
                            paddingBottom: 35,
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginBottom: 20,
                            }}
                        >
                            <Ionicons
                                name="arrow-back"
                                size={22}
                                color="#F97316"
                            />
                            <Text
                                style={{
                                    color: "#374151",
                                    fontSize: 15,
                                    fontWeight: "600",
                                    marginLeft: 8,
                                }}
                            >
                                Back
                            </Text>
                        </TouchableOpacity>

                        <View
                            style={{
                                backgroundColor: "#FFFFFF",
                                borderRadius: 16,
                                padding: 20,
                                borderWidth: 1,
                                borderColor: "#E5E7EB",
                                marginBottom: 16,
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                }}
                            >
                                <View style={{ flex: 1, paddingRight: 10 }}>
                                    <Text
                                        style={{
                                            color: "#6B7280",
                                            fontSize: 12,
                                            marginBottom: 6,
                                        }}
                                    >
                                        ORDER NUMBER
                                    </Text>
                                    <Text
                                        style={{
                                            color: "#111827",
                                            fontSize: 21,
                                            fontWeight: "bold",
                                        }}
                                    >
                                        #{String(order._id).slice(-6).toUpperCase()}
                                    </Text>
                                </View>

                                <View
                                    style={{
                                        backgroundColor: "#FFF7ED",
                                        padding: 12,
                                        borderRadius: 12,
                                    }}
                                >
                                    <Ionicons
                                        name="receipt-outline"
                                        size={28}
                                        color="#F97316"
                                    />
                                </View>
                            </View>

                            <View
                                style={{
                                    height: 1,
                                    backgroundColor: "#F3F4F6",
                                    marginVertical: 18,
                                }}
                            />

                            <Text
                                style={{
                                    color: "#6B7280",
                                    fontSize: 13,
                                    marginBottom: 8,
                                }}
                            >
                                Order Status
                            </Text>

                            <View
                                style={{
                                    alignSelf: "flex-start",
                                    backgroundColor: `${getStatusColor(order.orderStatus)}18`,
                                    paddingHorizontal: 14,
                                    paddingVertical: 9,
                                    borderRadius: 10,
                                }}
                            >
                                <Text
                                    style={{
                                        color: getStatusColor(order.orderStatus),
                                        fontSize: 14,
                                        fontWeight: "bold",
                                    }}
                                >
                                    {order.orderStatus || "Pending"}
                                </Text>
                            </View>

                            <Text
                                style={{
                                    color: "#6B7280",
                                    fontSize: 12,
                                    marginTop: 16,
                                }}
                            >
                                Order Date: {formatDate(order.createdAt)}
                            </Text>
                        </View>

                        <View
                            style={{
                                backgroundColor: "#FFFFFF",
                                borderRadius: 16,
                                padding: 20,
                                borderWidth: 1,
                                borderColor: "#E5E7EB",
                                marginBottom: 16,
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    marginBottom: 18,
                                }}
                            >
                                <Ionicons
                                    name="person-circle-outline"
                                    size={25}
                                    color="#F97316"
                                />
                                <Text
                                    style={{
                                        color: "#111827",
                                        fontSize: 18,
                                        fontWeight: "bold",
                                        marginLeft: 9,
                                    }}
                                >
                                    Customer Details
                                </Text>
                            </View>

                            <Text style={{ color: "#6B7280", fontSize: 12 }}>
                                Name
                            </Text>
                            <Text
                                style={{
                                    color: "#111827",
                                    fontSize: 16,
                                    fontWeight: "600",
                                    marginTop: 5,
                                    marginBottom: 15,
                                }}
                            >
                                {customer?.name || "N/A"}
                            </Text>

                            <Text style={{ color: "#6B7280", fontSize: 12 }}>
                                Email
                            </Text>
                            <Text
                                style={{
                                    color: "#111827",
                                    fontSize: 15,
                                    marginTop: 5,
                                    marginBottom: 15,
                                }}
                            >
                                {customer?.email || "N/A"}
                            </Text>

                            <Text style={{ color: "#6B7280", fontSize: 12 }}>
                                Delivery Address
                            </Text>
                            <Text
                                style={{
                                    color: "#111827",
                                    fontSize: 15,
                                    lineHeight: 22,
                                    marginTop: 5,
                                }}
                            >
                                {order.deliveryAddress || "No address provided"}
                            </Text>
                        </View>

                        <View
                            style={{
                                backgroundColor: "#FFFFFF",
                                borderRadius: 16,
                                padding: 20,
                                borderWidth: 1,
                                borderColor: "#E5E7EB",
                                marginBottom: 16,
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    marginBottom: 16,
                                }}
                            >
                                <Ionicons
                                    name="fast-food-outline"
                                    size={25}
                                    color="#F97316"
                                />
                                <Text
                                    style={{
                                        color: "#111827",
                                        fontSize: 18,
                                        fontWeight: "bold",
                                        marginLeft: 9,
                                    }}
                                >
                                    Ordered Products
                                </Text>
                            </View>

                            {orderItems.length === 0 ? (
                                <Text style={{ color: "#6B7280", fontSize: 14 }}>
                                    No products found.
                                </Text>
                            ) : (
                                orderItems.map((item, index) => {
                                    const menuItem = item.menuItem;
                                    const quantity = Number(item.quantity) || 0;
                                    const price = Number(item.price) || 0;

                                    return (
                                        <View
                                            key={item._id || `${order._id}-${index}`}
                                            style={{
                                                paddingVertical: 14,
                                                borderTopWidth: index === 0 ? 1 : 0,
                                                borderBottomWidth: 1,
                                                borderColor: "#F3F4F6",
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: "#111827",
                                                    fontSize: 16,
                                                    fontWeight: "600",
                                                }}
                                            >
                                                {menuItem?.name || "Unavailable product"}
                                            </Text>

                                            <View
                                                style={{
                                                    flexDirection: "row",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    marginTop: 9,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        color: "#6B7280",
                                                        fontSize: 14,
                                                    }}
                                                >
                                                    Rs. {price.toLocaleString()} × {quantity}
                                                </Text>
                                                <Text
                                                    style={{
                                                        color: "#F97316",
                                                        fontSize: 17,
                                                        fontWeight: "bold",
                                                    }}
                                                >
                                                    Rs. {(price * quantity).toLocaleString()}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })
                            )}

                            <View
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginTop: 20,
                                }}
                            >
                                <Text
                                    style={{
                                        color: "#111827",
                                        fontSize: 17,
                                        fontWeight: "bold",
                                    }}
                                >
                                    Total Amount
                                </Text>
                                <Text
                                    style={{
                                        color: "#F97316",
                                        fontSize: 23,
                                        fontWeight: "bold",
                                    }}
                                >
                                    Rs. {(Number(order.totalAmount) || 0).toLocaleString()}
                                </Text>
                            </View>
                        </View>

                        <View
                            style={{
                                backgroundColor: "#FFFFFF",
                                borderRadius: 16,
                                padding: 20,
                                borderWidth: 1,
                                borderColor: "#E5E7EB",
                                marginBottom: 16,
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    marginBottom: 18,
                                }}
                            >
                                <Ionicons
                                    name="card-outline"
                                    size={25}
                                    color="#F97316"
                                />
                                <Text
                                    style={{
                                        color: "#111827",
                                        fontSize: 18,
                                        fontWeight: "bold",
                                        marginLeft: 9,
                                    }}
                                >
                                    Payment Details
                                </Text>
                            </View>

                            <View
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    marginBottom: 16,
                                }}
                            >
                                <Text style={{ color: "#6B7280", fontSize: 14 }}>
                                    Payment Method
                                </Text>
                                <Text
                                    style={{
                                        color: "#111827",
                                        fontSize: 14,
                                        fontWeight: "600",
                                        flex: 1,
                                        textAlign: "right",
                                        marginLeft: 10,
                                    }}
                                >
                                    {order.paymentMethod || "N/A"}
                                </Text>
                            </View>

                            <View
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                }}
                            >
                                <Text style={{ color: "#6B7280", fontSize: 14 }}>
                                    Payment Status
                                </Text>
                                <Text
                                    style={{
                                        color:
                                            order.paymentStatus === "Paid"
                                                ? "#16A34A"
                                                : order.paymentStatus === "Failed"
                                                ? "#DC2626"
                                                : "#D97706",
                                        fontSize: 14,
                                        fontWeight: "bold",
                                    }}
                                >
                                    {order.paymentStatus || "Pending"}
                                </Text>
                            </View>
                        </View>

                        <View
                            style={{
                                backgroundColor: "#FFFFFF",
                                borderRadius: 16,
                                padding: 20,
                                borderWidth: 1,
                                borderColor: "#E5E7EB",
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    marginBottom: 8,
                                }}
                            >
                                <Ionicons
                                    name="sync-outline"
                                    size={25}
                                    color="#F97316"
                                />
                                <Text
                                    style={{
                                        color: "#111827",
                                        fontSize: 18,
                                        fontWeight: "bold",
                                        marginLeft: 9,
                                    }}
                                >
                                    Update Order Status
                                </Text>
                            </View>

                            <Text
                                style={{
                                    color: "#6B7280",
                                    fontSize: 13,
                                    lineHeight: 19,
                                    marginBottom: 16,
                                }}
                            >
                                Only managers can update order status.
                            </Text>

                            {ORDER_STATUSES.map((status) => {
                                const selected = order.orderStatus === status;

                                return (
                                    <TouchableOpacity
                                        key={status}
                                        disabled={updating || selected}
                                        onPress={() => updateStatus(status)}
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: 14,
                                            borderRadius: 10,
                                            borderWidth: 1,
                                            borderColor: selected
                                                ? getStatusColor(status)
                                                : "#E5E7EB",
                                            backgroundColor: selected
                                                ? `${getStatusColor(status)}12`
                                                : "#FFFFFF",
                                            marginTop: 9,
                                            opacity: updating && !selected ? 0.6 : 1,
                                        }}
                                    >
                                        <View
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                            }}
                                        >
                                            <View
                                                style={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: 5,
                                                    backgroundColor: getStatusColor(status),
                                                    marginRight: 11,
                                                }}
                                            />
                                            <Text
                                                style={{
                                                    color: selected
                                                        ? getStatusColor(status)
                                                        : "#374151",
                                                    fontSize: 15,
                                                    fontWeight: selected ? "bold" : "500",
                                                }}
                                            >
                                                {status}
                                            </Text>
                                        </View>

                                        {selected ? (
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={21}
                                                color={getStatusColor(status)}
                                            />
                                        ) : (
                                            <Ionicons
                                                name="chevron-forward"
                                                size={19}
                                                color="#9CA3AF"
                                            />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}

                            {updating && (
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginTop: 18,
                                    }}
                                >
                                    <ActivityIndicator color="#F97316" />
                                    <Text
                                        style={{
                                            color: "#6B7280",
                                            marginLeft: 10,
                                            fontSize: 13,
                                        }}
                                    >
                                        Updating order status...
                                    </Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                )}
            </View>

            <Toast
                visible={toast.visible}
                type={toast.type}
                message={toast.message}
                onHide={() =>
                    setToast((prev) => ({ ...prev, visible: false }))
                }
            />
        </SafeAreaView>
    );
};

export default OrderDetails;