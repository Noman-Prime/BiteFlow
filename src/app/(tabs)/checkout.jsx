import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
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
    const router = useRouter();
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
            <SafeAreaView className="flex-1 items-center justify-center bg-[#111111]">
                <ActivityIndicator size="large" color="#F97316" />
                <Text className="mt-3 text-gray-300">Loading your bucket...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#111111]">
            <Navbar />

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
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="mb-5 flex-row items-center self-start"
                >
                    <Ionicons name="arrow-back" size={22} color="#F97316" />
                    <Text className="ml-2 text-base font-semibold text-white">
                        Back to Bucket
                    </Text>
                </TouchableOpacity>

                <Text className="text-3xl font-bold text-white">
                    Checkout
                </Text>
                <Text className="mt-2 mb-6 text-gray-400">
                    Review your items and complete your order.
                </Text>

                {cartItems.length === 0 ? (
                    <View className="items-center rounded-2xl border border-gray-800 bg-[#1B1B1B] px-5 py-10">
                        <Ionicons
                            name="bag-outline"
                            size={55}
                            color="#F97316"
                        />
                        <Text className="mt-4 text-xl font-bold text-white">
                            Your bucket is empty
                        </Text>
                        <Text className="mt-2 text-center text-gray-400">
                            Add some delicious food before checking out.
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.replace("/(tabs)")}
                            className="mt-5 rounded-xl bg-[#F97316] px-6 py-3"
                        >
                            <Text className="font-bold text-white">
                                Browse Menu
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <View className="mb-6 rounded-2xl border border-gray-800 bg-[#1B1B1B] p-4">
                            <Text className="mb-4 text-xl font-bold text-white">
                                Order Items
                            </Text>

                            {cartItems.map((item) => (
                                <View
                                    key={item.id}
                                    className="mb-4 flex-row items-center border-b border-gray-800 pb-4"
                                >
                                    {item.image ? (
                                        <Image
                                            source={{ uri: item.image }}
                                            className="h-16 w-16 rounded-xl bg-gray-800"
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View className="h-16 w-16 items-center justify-center rounded-xl bg-gray-800">
                                            <Ionicons
                                                name="fast-food-outline"
                                                size={28}
                                                color="#F97316"
                                            />
                                        </View>
                                    )}

                                    <View className="ml-3 flex-1">
                                        <Text
                                            className="font-semibold text-white"
                                            numberOfLines={2}
                                        >
                                            {item.name}
                                        </Text>
                                        <Text className="mt-1 text-sm text-gray-400">
                                            Rs. {item.price} each
                                        </Text>

                                        <View className="mt-2 flex-row items-center">
                                            <TouchableOpacity
                                                onPress={() =>
                                                    updateQuantity(item.id, -1)
                                                }
                                                className="h-8 w-8 items-center justify-center rounded-lg bg-gray-800"
                                            >
                                                <Ionicons
                                                    name="remove"
                                                    size={18}
                                                    color="white"
                                                />
                                            </TouchableOpacity>

                                            <Text className="mx-3 font-semibold text-white">
                                                {item.quantity}
                                            </Text>

                                            <TouchableOpacity
                                                onPress={() =>
                                                    updateQuantity(item.id, 1)
                                                }
                                                className="h-8 w-8 items-center justify-center rounded-lg bg-gray-800"
                                            >
                                                <Ionicons
                                                    name="add"
                                                    size={18}
                                                    color="white"
                                                />
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={() =>
                                                    removeFromCart(item.id)
                                                }
                                                className="ml-auto p-2"
                                            >
                                                <Ionicons
                                                    name="trash-outline"
                                                    size={19}
                                                    color="#EF4444"
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <Text className="ml-2 font-bold text-[#F97316]">
                                        Rs. {item.price * item.quantity}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        <View className="mb-6 rounded-2xl border border-gray-800 bg-[#1B1B1B] p-4">
                            <Text className="mb-4 text-xl font-bold text-white">
                                Delivery Address
                            </Text>

                            <TextInput
                                value={deliveryAddress}
                                onChangeText={setDeliveryAddress}
                                placeholder="Enter your complete delivery address"
                                placeholderTextColor="#9CA3AF"
                                multiline
                                textAlignVertical="top"
                                className="min-h-28 rounded-xl border border-gray-700 bg-[#111111] p-4 text-base text-white"
                            />

                            <Text className="mt-2 text-xs text-gray-500">
                                Include your house number, street, and area.
                            </Text>
                        </View>

                        <View className="mb-6 rounded-2xl border border-gray-800 bg-[#1B1B1B] p-4">
                            <Text className="mb-4 text-xl font-bold text-white">
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
                                    className={`mb-3 flex-row items-center rounded-xl border p-4 ${
                                        paymentMethod === method.label
                                            ? "border-[#F97316] bg-[#2A1B12]"
                                            : "border-gray-700 bg-[#111111]"
                                    }`}
                                >
                                    <Ionicons
                                        name={method.icon}
                                        size={25}
                                        color="#F97316"
                                    />

                                    <View className="ml-3 flex-1">
                                        <Text className="font-semibold text-white">
                                            {method.label}
                                        </Text>
                                        <Text className="mt-1 text-sm text-gray-400">
                                            {method.description}
                                        </Text>
                                    </View>

                                    <Ionicons
                                        name={
                                            paymentMethod === method.label
                                                ? "radio-button-on"
                                                : "radio-button-off"
                                        }
                                        size={22}
                                        color={
                                            paymentMethod === method.label
                                                ? "#F97316"
                                                : "#9CA3AF"
                                        }
                                    />
                                </TouchableOpacity>
                            ))}

                            {paymentMethod === "Online" && (
                                <Text className="mt-1 text-sm text-amber-400">
                                    Online payment processing is not connected yet.
                                </Text>
                            )}
                        </View>

                        <View className="mb-6 rounded-2xl border border-gray-800 bg-[#1B1B1B] p-4">
                            <Text className="mb-4 text-xl font-bold text-white">
                                Order Summary
                            </Text>

                            <View className="mb-3 flex-row justify-between">
                                <Text className="text-gray-400">Subtotal</Text>
                                <Text className="text-white">
                                    Rs. {subtotal}
                                </Text>
                            </View>

                            <View className="mb-3 flex-row justify-between">
                                <Text className="text-gray-400">
                                    Delivery Fee
                                </Text>
                                <Text className="text-white">
                                    Rs. {deliveryFee}
                                </Text>
                            </View>

                            <View className="mb-4 border-t border-gray-700 pt-4">
                                <View className="flex-row justify-between">
                                    <Text className="text-lg font-bold text-white">
                                        Estimated Total
                                    </Text>
                                    <Text className="text-lg font-bold text-[#F97316]">
                                        Rs. {total}
                                    </Text>
                                </View>
                            </View>

                            <Text className="mb-4 text-xs text-gray-500">
                                The backend calculates your order amount using
                                the current menu prices. The delivery fee shown
                                here is an estimate and is not included in the
                                backend order total yet.
                            </Text>

                            <TouchableOpacity
                                onPress={handlePlaceOrder}
                                disabled={placingOrder || cartItems.length === 0}
                                className={`items-center rounded-xl py-4 ${
                                    placingOrder || cartItems.length === 0
                                        ? "bg-gray-600"
                                        : "bg-[#F97316]"
                                }`}
                            >
                                {placingOrder ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-base font-bold text-white">
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