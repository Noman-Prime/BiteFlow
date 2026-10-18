
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ORDER_URL = "https://mad-zwov.onrender.com/api/v1/order";

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

    const totalAmount = productPrice * quantity;

    const placeOrder = async () => {
        if (!productId) {
            Alert.alert("Error", "Product information is missing.");
            return;
        }

        if (!deliveryAddress.trim()) {
            Alert.alert("Required", "Please enter your delivery address.");
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

            Alert.alert(
                "Order Placed!",
                `Your order for ${quantity} × ${productName} has been placed successfully.`,
                [
                    {
                        text: "View Orders",
                        onPress: () => router.replace("/(tabs)/orders"),
                    },
                ]
            );
        } catch (err) {
            console.log(
                "Place order error:",
                err.response?.data || err.message
            );

            if (
                err.response?.status === 401 ||
                err.response?.status === 403
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
                Alert.alert(
                    "Order Failed",
                    err.response?.data?.message ||
                        err.message ||
                        "Something went wrong. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
            <View className="flex-row items-center border-b border-gray-100 px-5 py-4">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-gray-100"
                >
                    <Ionicons name="arrow-back" size={20} color="#111827" />
                </TouchableOpacity>

                <View>
                    <Text className="text-base font-extrabold text-black">
                        Order Now
                    </Text>
                    <Text className="mt-0.5 text-xs text-gray-500">
                        Customize your order
                    </Text>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="overflow-hidden rounded-3xl border border-gray-100 bg-white">
                    {productImage ? (
                        <Image
                            source={{ uri: productImage }}
                            className="h-56 w-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="h-56 items-center justify-center bg-orange-50">
                            <Ionicons
                                name="fast-food-outline"
                                size={64}
                                color="#F97316"
                            />
                        </View>
                    )}

                    <View className="p-5">
                        <Text className="text-xl font-extrabold text-black">
                            {productName || "Selected Product"}
                        </Text>

                        <Text className="mt-2 text-lg font-extrabold text-orange-600">
                            Rs. {productPrice.toLocaleString("en-PK")}
                        </Text>

                        <Text className="mt-1 text-xs text-gray-500">
                            Price per item
                        </Text>
                    </View>
                </View>

                <View className="mt-6 rounded-3xl border border-gray-100 p-5">
                    <Text className="text-sm font-extrabold text-black">
                        Select Quantity
                    </Text>

                    <View className="mt-4 flex-row items-center justify-between">
                        <Text className="text-sm text-gray-600">
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
                                className={`h-10 w-10 items-center justify-center rounded-xl ${
                                    quantity <= 1
                                        ? "bg-gray-100"
                                        : "bg-orange-50"
                                }`}
                            >
                                <Ionicons
                                    name="remove"
                                    size={20}
                                    color={quantity <= 1 ? "#9CA3AF" : "#F97316"}
                                />
                            </TouchableOpacity>

                            <Text className="mx-6 text-base font-extrabold text-black">
                                {quantity}
                            </Text>

                            <TouchableOpacity
                                onPress={() =>
                                    setQuantity((current) => current + 1)
                                }
                                className="h-10 w-10 items-center justify-center rounded-xl bg-orange-500"
                            >
                                <Ionicons
                                    name="add"
                                    size={20}
                                    color="#FFFFFF"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View className="mt-5">
                    <Text className="mb-2 text-sm font-bold text-black">
                        Delivery Address
                    </Text>

                    <TextInput
                        value={deliveryAddress}
                        onChangeText={setDeliveryAddress}
                        placeholder="Enter your complete delivery address"
                        multiline
                        textAlignVertical="top"
                        className="min-h-24 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-black"
                    />
                </View>

                <View className="mt-5">
                    <Text className="mb-3 text-sm font-bold text-black">
                        Payment Method
                    </Text>

                    {["Cash On Delivery", "Online"].map((method) => (
                        <TouchableOpacity
                            key={method}
                            onPress={() => setPaymentMethod(method)}
                            className={`mb-3 flex-row items-center rounded-2xl border p-4 ${
                                paymentMethod === method
                                    ? "border-orange-400 bg-orange-50"
                                    : "border-gray-200 bg-white"
                            }`}
                        >
                            <Ionicons
                                name={
                                    method === "Cash On Delivery"
                                        ? "cash-outline"
                                        : "card-outline"
                                }
                                size={22}
                                color={
                                    paymentMethod === method
                                        ? "#F97316"
                                        : "#6B7280"
                                }
                            />

                            <Text className="ml-3 flex-1 text-sm font-semibold text-gray-800">
                                {method}
                            </Text>

                            <Ionicons
                                name={
                                    paymentMethod === method
                                        ? "radio-button-on"
                                        : "radio-button-off"
                                }
                                size={20}
                                color={
                                    paymentMethod === method
                                        ? "#F97316"
                                        : "#9CA3AF"
                                }
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                <View className="mt-2 rounded-3xl bg-gray-50 p-5">
                    <Text className="text-sm font-extrabold text-black">
                        Order Summary
                    </Text>

                    <View className="mt-4 flex-row justify-between">
                        <Text className="text-sm text-gray-500">
                            {productName || "Product"} × {quantity}
                        </Text>

                        <Text className="text-sm font-semibold text-gray-800">
                            Rs. {totalAmount.toLocaleString("en-PK")}
                        </Text>
                    </View>

                    <View className="mt-4 border-t border-gray-200 pt-4">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-sm font-bold text-black">
                                Total
                            </Text>

                            <Text className="text-xl font-extrabold text-orange-600">
                                Rs. {totalAmount.toLocaleString("en-PK")}
                            </Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={placeOrder}
                    disabled={loading}
                    activeOpacity={0.8}
                    className={`mt-6 flex-row items-center justify-center rounded-2xl py-4 ${
                        loading ? "bg-orange-300" : "bg-orange-500"
                    }`}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={20}
                                color="#FFFFFF"
                            />
                            <Text className="ml-2 text-sm font-extrabold text-white">
                                Place Order · Rs. {totalAmount.toLocaleString("en-PK")}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

export default OrderNow;