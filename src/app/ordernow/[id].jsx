import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "../../components/Toast";

const ORDER_URL = process.env.EXPO_PUBLIC_GET_ORDER_BY_ID_URL;

const OrderNow = () => {
    const router = useRouter();
    const { id, name, price, imageUrl } = useLocalSearchParams();

    const productId = Array.isArray(id) ? id[0] : id;
    const productName = Array.isArray(name) ? name[0] : name;
    const productImage = Array.isArray(imageUrl) ? imageUrl[0] : imageUrl;
    const productPrice = Number(Array.isArray(price) ? price[0] : price) || 0;

    const [quantity, setQuantity] = useState(1);
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Cash On Delivery");
    const [loading, setLoading] = useState(false);

    const [toast, setToast] = useState({
        visible: false,
        message: "",
        type: "success",
    });

    const totalAmount = productPrice * quantity;

    const showToast = (message, type = "success") => {
        setToast({ visible: true, message, type });
    };

    const handleGoBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/(tabs)");
        }
    };

    const placeOrder = async () => {
        if (!productId) {
            showToast("Product information is missing.", "error");
            return;
        }

        if (!deliveryAddress.trim()) {
            showToast("Please enter your delivery address.", "error");
            return;
        }

        try {
            setLoading(true);

            const token = await AsyncStorage.getItem("token");

            if (!token) {
                Alert.alert(
                    "Sign In Required",
                    "Please sign in or create an account to complete your order.",
                    [
                        { text: "Cancel", style: "cancel" },
                        {
                            text: "Sign In",
                            onPress: () => router.push("/signin"),
                        },
                    ]
                );
                return;
            }

            const response = await axios.post(
                ORDER_URL,
                {
                    orderItems: [
                        {
                            menuItem: productId,
                            quantity,
                        },
                    ],
                    deliveryAddress: deliveryAddress.trim(),
                    paymentMethod,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    withCredentials: true,
                }
            );

            if (response.data?.success === false) {
                throw new Error(
                    response.data?.message || "Unable to place your order."
                );
            }

            showToast("Order placed successfully!", "success");

            setTimeout(() => {
                router.replace("/(tabs)/order");
            }, 1200);
        } catch (error) {
            console.error(
                "Place order error:",
                error.response?.data || error.message
            );

            if (
                error.response?.status === 401 ||
                error.response?.status === 403
            ) {
                Alert.alert(
                    "Sign In Required",
                    "Please sign in again to place your order.",
                    [
                        { text: "Cancel", style: "cancel" },
                        {
                            text: "Sign In",
                            onPress: () => router.push("/signin"),
                        },
                    ]
                );
            } else {
                showToast(
                    error.response?.data?.message ||
                        error.message ||
                        "Something went wrong. Please try again.",
                    "error"
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={["top"]}>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />

            <Toast
                visible={toast.visible}
                type={toast.type}
                message={toast.message}
                onHide={() =>
                    setToast((current) => ({
                        ...current,
                        visible: false,
                    }))
                }
            />

            <View className="flex-row items-center border-b border-[#F1F5F9] bg-white px-5 py-3">
                <TouchableOpacity
                    onPress={handleGoBack}
                    className="mr-3 h-10 w-10 items-center justify-center rounded-2xl border border-[#DBEAFE] bg-white shadow-sm"
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={18} color="#2563EB" />
                </TouchableOpacity>

                <View>
                    <Text className="text-sm font-black text-[#0F172A]">
                        Order Now
                    </Text>
                    <Text className="mt-0.5 text-[10px] font-medium text-[#64748B]">
                        Customize your order
                    </Text>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    padding: 20,
                    paddingBottom: 32,
                }}
                showsVerticalScrollIndicator={false}
            >
                <View className="overflow-hidden rounded-3xl border border-[#DBEAFE] bg-white shadow-sm">
                    {productImage ? (
                        <Image
                            source={{ uri: productImage }}
                            className="h-52 w-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="h-52 items-center justify-center border-b border-[#DBEAFE] bg-[#EFF6FF]">
                            <Ionicons
                                name="fast-food-outline"
                                size={56}
                                color="#2563EB"
                            />
                        </View>
                    )}

                    <View className="p-5">
                        <Text className="text-base font-black text-[#0F172A]">
                            {productName || "Selected Product"}
                        </Text>

                        <Text className="mt-1 text-sm font-black text-[#2563EB]">
                            Rs. {productPrice.toLocaleString("en-PK")}
                        </Text>

                        <Text className="mt-0.5 text-[10px] font-medium text-[#64748B]">
                            Price per item
                        </Text>
                    </View>
                </View>

                <View className="mt-5 rounded-3xl border border-[#DBEAFE] bg-white p-5 shadow-sm">
                    <Text className="text-xs font-black text-[#0F172A]">
                        Select Quantity
                    </Text>

                    <View className="mt-4 flex-row items-center justify-between">
                        <Text className="text-xs font-medium text-[#64748B]">
                            Number of items
                        </Text>

                        <View className="flex-row items-center">
                            <TouchableOpacity
                                onPress={() =>
                                    setQuantity((current) =>
                                        Math.max(1, current - 1)
                                    )
                                }
                                disabled={quantity <= 1}
                                className={`h-10 w-10 items-center justify-center rounded-2xl border ${
                                    quantity <= 1
                                        ? "border-[#F1F5F9] bg-[#F8FAFC]"
                                        : "border-[#DBEAFE] bg-[#EFF6FF]"
                                }`}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name="remove"
                                    size={18}
                                    color={quantity <= 1 ? "#94A3B8" : "#2563EB"}
                                />
                            </TouchableOpacity>

                            <Text className="mx-5 text-sm font-black text-[#0F172A]">
                                {quantity}
                            </Text>

                            <TouchableOpacity
                                onPress={() =>
                                    setQuantity((current) => current + 1)
                                }
                                className="h-10 w-10 items-center justify-center rounded-2xl bg-[#2563EB] shadow-sm"
                                activeOpacity={0.8}
                            >
                                <Ionicons
                                    name="add"
                                    size={18}
                                    color="#FFFFFF"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View className="mt-5">
                    <Text className="mb-2 text-xs font-black text-[#0F172A]">
                        Delivery Address
                    </Text>

                    <TextInput
                        value={deliveryAddress}
                        onChangeText={setDeliveryAddress}
                        placeholder="Enter your complete delivery address"
                        placeholderTextColor="#94A3B8"
                        multiline
                        textAlignVertical="top"
                        className="min-h-24 rounded-2xl border border-[#DBEAFE] bg-white px-4 py-3 text-xs font-bold text-[#0F172A] shadow-sm"
                    />
                </View>

                <View className="mt-5">
                    <Text className="mb-3 text-xs font-black text-[#0F172A]">
                        Payment Method
                    </Text>

                    {["Cash On Delivery", "Online"].map((method) => (
                        <TouchableOpacity
                            key={method}
                            onPress={() => setPaymentMethod(method)}
                            className={`mb-3 flex-row items-center rounded-2xl border p-4 shadow-sm ${
                                paymentMethod === method
                                    ? "border-[#2563EB] bg-[#EFF6FF]"
                                    : "border-[#DBEAFE] bg-white"
                            }`}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name={
                                    method === "Cash On Delivery"
                                        ? "cash-outline"
                                        : "card-outline"
                                }
                                size={20}
                                color={
                                    paymentMethod === method
                                        ? "#2563EB"
                                        : "#64748B"
                                }
                            />

                            <Text className="ml-3 flex-1 text-xs font-bold text-[#0F172A]">
                                {method}
                            </Text>

                            <Ionicons
                                name={
                                    paymentMethod === method
                                        ? "radio-button-on"
                                        : "radio-button-off"
                                }
                                size={18}
                                color={
                                    paymentMethod === method
                                        ? "#2563EB"
                                        : "#94A3B8"
                                }
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                <View className="mt-3 rounded-3xl border border-[#DBEAFE] bg-white p-5 shadow-sm">
                    <Text className="text-xs font-black text-[#0F172A]">
                        Order Summary
                    </Text>

                    <View className="mt-3 flex-row justify-between">
                        <Text className="text-xs text-[#64748B]">
                            {productName || "Product"} × {quantity}
                        </Text>

                        <Text className="text-xs font-bold text-[#0F172A]">
                            Rs. {totalAmount.toLocaleString("en-PK")}
                        </Text>
                    </View>

                    <View className="mt-3 border-t border-[#F1F5F9] pt-3">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-xs font-black text-[#0F172A]">
                                Total
                            </Text>

                            <Text className="text-base font-black text-[#2563EB]">
                                Rs. {totalAmount.toLocaleString("en-PK")}
                            </Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={placeOrder}
                    disabled={loading}
                    activeOpacity={0.8}
                    className={`mt-6 flex-row items-center justify-center rounded-2xl py-4 shadow-sm ${
                        loading ? "bg-[#94A3B8]" : "bg-[#2563EB]"
                    }`}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <>
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={18}
                                color="#FFFFFF"
                            />
                            <Text className="ml-2 text-xs font-bold text-white">
                                Place Order · Rs.{" "}
                                {totalAmount.toLocaleString("en-PK")}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

export default OrderNow;