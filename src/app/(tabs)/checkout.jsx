import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Navbar from "../../components/Navbar";
import Toast from "../../components/Toast";
import { useCart } from "../../context/CartContext";

const ORDER_URL = "https://mad-zwov.onrender.com/api/v1/order";

const Checkout = () => {
    const {
        cartItems,
        isCartLoaded,
        updateQuantity,
        removeFromCart,
        subtotal,
        clearCart,
    } = useCart();

    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Cash On Delivery");
    const [placingOrder, setPlacingOrder] = useState(false);
    const [toast, setToast] = useState({
        visible: false,
        message: "",
        type: "success",
    });

    const deliveryFee = subtotal > 0 ? 150 : 0;
    const total = subtotal + deliveryFee;

    const showToast = (message, type = "success") => {
        setToast({ visible: true, message, type });
    };

    const handlePlaceOrder = async () => {
        if (cartItems.length === 0) {
            showToast("Your bucket is empty.", "error");
            return;
        }

        if (!deliveryAddress.trim()) {
            showToast("Please enter your delivery address.", "error");
            return;
        }

        try {
            setPlacingOrder(true);

            const token = await AsyncStorage.getItem("token");

            if (!token) {
                router.push({
                    pathname: "/signin",
                    params: { redirect: "/(tabs)/checkout" },
                });
                return;
            }

            const orderItems = cartItems.map((item) => ({
                menuItem: item.menuItem || item.id,
                quantity: item.quantity,
            }));

            const response = await axios.post(
                ORDER_URL,
                {
                    orderItems,
                    deliveryAddress: deliveryAddress.trim(),
                    paymentMethod,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    withCredentials: true,
                }
            );

            if (response.data?.success) {
                await clearCart();

                showToast("Your order has been placed!", "success");

                setTimeout(() => {
                    router.replace("/");
                }, 1500);
            } else {
                showToast(
                    response.data?.message || "Unable to place your order.",
                    "error"
                );
            }
        } catch (error) {
            showToast(
                error.response?.data?.message ||
                    "Something went wrong while placing your order.",
                "error"
            );
        } finally {
            setPlacingOrder(false);
        }
    };

    if (!isCartLoaded) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-[#F8FAFC]" edges={["top"]}>
                <StatusBar style="dark" backgroundColor="#FFFFFF" />
                <ActivityIndicator size="large" color="#2563EB" />
                <Text className="mt-3 text-xs font-bold text-[#64748B]">
                    Loading your bucket...
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={["top"]}>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />

            {/* Standardized Navbar Header for Status Bar clearance */}
            <View className="bg-white pb-2 pt-1 border-b border-[#F1F5F9]">
                <Navbar />
            </View>

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() =>
                    setToast((previous) => ({
                        ...previous,
                        visible: false,
                    }))
                }
            />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <TouchableOpacity
                    onPress={() => {
                        if (router.canGoBack()) {
                            router.back();
                        } else {
                            router.replace("/");
                        }
                    }}
                    className="mb-4 flex-row items-center self-start"
                >
                    <Ionicons name="arrow-back" size={20} color="#2563EB" />
                    <Text className="ml-2 text-xs font-bold text-[#2563EB]">
                        Back to Bucket
                    </Text>
                </TouchableOpacity>

                <Text className="text-2xl font-black text-[#0F172A]">
                    Checkout
                </Text>
                <Text className="mt-1 mb-6 text-xs text-[#64748B]">
                    Review your items and complete your order.
                </Text>

                {cartItems.length === 0 ? (
                    <View className="items-center rounded-3xl border border-[#DBEAFE] bg-white px-5 py-12 shadow-sm">
                        <View className="h-20 w-20 items-center justify-center rounded-3xl border border-[#DBEAFE] bg-[#EFF6FF] mb-4">
                            <Ionicons
                                name="bag-outline"
                                size={36}
                                color="#2563EB"
                            />
                        </View>
                        <Text className="text-base font-extrabold text-[#0F172A]">
                            Your bucket is empty
                        </Text>
                        <Text className="mt-1 text-center text-xs text-[#64748B]">
                            Add some delicious food before checking out.
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.replace("/(tabs)")}
                            className="mt-6 rounded-2xl bg-[#2563EB] px-6 py-3.5 shadow-sm"
                        >
                            <Text className="text-xs font-bold text-white">
                                Browse Menu
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <View className="mb-6 rounded-3xl border border-[#DBEAFE] bg-white p-4 shadow-sm">
                            <Text className="mb-4 text-base font-black text-[#0F172A]">
                                Order Items
                            </Text>

                            {cartItems.map((item) => (
                                <View
                                    key={item.id}
                                    className="mb-4 flex-row items-center border-b border-[#F1F5F9] pb-4"
                                >
                                    {item.image ? (
                                        <Image
                                            source={{ uri: item.image }}
                                            className="h-16 w-16 rounded-2xl bg-[#EFF6FF]"
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-[#EFF6FF]">
                                            <Ionicons
                                                name="fast-food-outline"
                                                size={24}
                                                color="#2563EB"
                                            />
                                        </View>
                                    )}

                                    <View className="ml-3 flex-1">
                                        <Text
                                            className="text-xs font-bold text-[#0F172A]"
                                            numberOfLines={2}
                                        >
                                            {item.name}
                                        </Text>
                                        <Text className="mt-0.5 text-xs font-medium text-[#64748B]">
                                            Rs. {item.price} each
                                        </Text>

                                        <View className="mt-2 flex-row items-center">
                                            <TouchableOpacity
                                                onPress={() =>
                                                    updateQuantity(item.id, -1)
                                                }
                                                className="h-7 w-7 items-center justify-center rounded-xl bg-[#EFF6FF] border border-[#DBEAFE]"
                                            >
                                                <Ionicons
                                                    name="remove"
                                                    size={16}
                                                    color="#2563EB"
                                                />
                                            </TouchableOpacity>

                                            <Text className="mx-3 text-xs font-bold text-[#0F172A]">
                                                {item.quantity}
                                            </Text>

                                            <TouchableOpacity
                                                onPress={() =>
                                                    updateQuantity(item.id, 1)
                                                }
                                                className="h-7 w-7 items-center justify-center rounded-xl bg-[#EFF6FF] border border-[#DBEAFE]"
                                            >
                                                <Ionicons
                                                    name="add"
                                                    size={16}
                                                    color="#2563EB"
                                                />
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={() =>
                                                    removeFromCart(item.id)
                                                }
                                                className="ml-auto p-1.5"
                                            >
                                                <Ionicons
                                                    name="trash-outline"
                                                    size={17}
                                                    color="#DC2626"
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <Text className="ml-2 text-xs font-black text-[#2563EB]">
                                        Rs. {item.price * item.quantity}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        <View className="mb-6 rounded-3xl border border-[#DBEAFE] bg-white p-4 shadow-sm">
                            <Text className="mb-3 text-base font-black text-[#0F172A]">
                                Delivery Address
                            </Text>

                            <TextInput
                                value={deliveryAddress}
                                onChangeText={setDeliveryAddress}
                                placeholder="Enter your complete delivery address"
                                placeholderTextColor="#94A3B8"
                                multiline
                                textAlignVertical="top"
                                className="min-h-24 rounded-2xl border border-[#DBEAFE] bg-[#EFF6FF] p-4 text-xs font-medium text-[#0F172A]"
                            />

                            <Text className="mt-2 text-[10px] text-[#64748B]">
                                Include your house number, street, and area.
                            </Text>
                        </View>

                        <View className="mb-6 rounded-3xl border border-[#DBEAFE] bg-white p-4 shadow-sm">
                            <Text className="mb-4 text-base font-black text-[#0F172A]">
                                Payment Method
                            </Text>

                            {[
                                {
                                    label: "Cash On Delivery",
                                    description: "Pay when your order arrives",
                                    icon: "cash-outline",
                                },
                                {
                                    label: "Online",
                                    description: "Online payment option",
                                    icon: "card-outline",
                                },
                            ].map((method) => (
                                <TouchableOpacity
                                    key={method.label}
                                    onPress={() =>
                                        setPaymentMethod(method.label)
                                    }
                                    className={`mb-3 flex-row items-center rounded-2xl border p-4 ${
                                        paymentMethod === method.label
                                            ? "border-[#2563EB] bg-[#EFF6FF]"
                                            : "border-[#DBEAFE] bg-white"
                                    }`}
                                >
                                    <Ionicons
                                        name={method.icon}
                                        size={22}
                                        color="#2563EB"
                                    />

                                    <View className="ml-3 flex-1">
                                        <Text className="text-xs font-black text-[#0F172A]">
                                            {method.label}
                                        </Text>
                                        <Text className="mt-0.5 text-[10px] text-[#64748B]">
                                            {method.description}
                                        </Text>
                                    </View>

                                    <Ionicons
                                        name={
                                            paymentMethod === method.label
                                                ? "radio-button-on"
                                                : "radio-button-off"
                                        }
                                        size={20}
                                        color={
                                            paymentMethod === method.label
                                                ? "#2563EB"
                                                : "#94A3B8"
                                        }
                                    />
                                </TouchableOpacity>
                            ))}

                            {paymentMethod === "Online" && (
                                <Text className="mt-1 text-xs font-medium text-amber-600">
                                    Online payment processing is not connected yet.
                                </Text>
                            )}
                        </View>

                        <View className="mb-6 rounded-3xl border border-[#DBEAFE] bg-white p-4 shadow-sm">
                            <Text className="mb-4 text-base font-black text-[#0F172A]">
                                Order Summary
                            </Text>

                            <View className="mb-3 flex-row justify-between">
                                <Text className="text-xs text-[#64748B]">Subtotal</Text>
                                <Text className="text-xs font-bold text-[#0F172A]">
                                    Rs. {subtotal}
                                </Text>
                            </View>

                            <View className="mb-3 flex-row justify-between">
                                <Text className="text-xs text-[#64748B]">
                                    Delivery Fee
                                </Text>
                                <Text className="text-xs font-bold text-[#0F172A]">
                                    Rs. {deliveryFee}
                                </Text>
                            </View>

                            <View className="mb-4 border-t border-[#F1F5F9] pt-4">
                                <View className="flex-row justify-between">
                                    <Text className="text-sm font-black text-[#0F172A]">
                                        Estimated Total
                                    </Text>
                                    <Text className="text-sm font-black text-[#2563EB]">
                                        Rs. {total}
                                    </Text>
                                </View>
                            </View>

                            <Text className="mb-4 text-[10px] text-[#64748B]">
                                The backend calculates your order amount using
                                the current menu prices. The delivery fee shown
                                here is an estimate and is not included in the
                                backend order total yet.
                            </Text>

                            <TouchableOpacity
                                onPress={handlePlaceOrder}
                                disabled={placingOrder || cartItems.length === 0}
                                className={`items-center rounded-2xl py-4 shadow-sm ${
                                    placingOrder || cartItems.length === 0
                                        ? "bg-gray-300"
                                        : "bg-[#2563EB]"
                                }`}
                            >
                                {placingOrder ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-xs font-bold text-white">
                                        Place Order
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default Checkout;