
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Navbar from "../components/Navbar";
import Toast from "../components/Toast";
import { useCart } from "../context/CartContext";

const MenuItemDetail = () => {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { addToCart } = useCart();

    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({
        visible: false,
        type: "success",
        message: "",
    });

    const baseUrl =
        process.env.EXPO_PUBLIC_MENU_URL ||
        process.env.EXPO_PUBLIC_GET_MENU_URL;

    const showToast = (message, type = "success") => {
        setToast({ visible: true, type, message });
    };

    useEffect(() => {
        const fetchItemById = async () => {
            if (!id || !baseUrl) {
                setItem(null);
                setLoading(false);
                return;
            }

            setLoading(true);

            try {
                const url = `${baseUrl.replace(/\/+$/, "")}/${encodeURIComponent(id)}`;

                const response = await axios.get(url, {
                    headers: { Accept: "application/json" },
                });

                const responseData =
                    response.data?.data ??
                    response.data?.menuItem ??
                    response.data?.item ??
                    response.data;

                const menuItem = Array.isArray(responseData)
                    ? responseData[0]
                    : responseData;

                setItem(
                    menuItem && (menuItem._id || menuItem.id)
                        ? menuItem
                        : null
                );
            } catch (error) {
                console.error(
                    "Error fetching menu item:",
                    error.response?.data || error.message
                );

                setItem(null);
            } finally {
                setLoading(false);
            }
        };

        fetchItemById();
    }, [id, baseUrl]);

    const handleAddToBucket = () => {
        if (!item || item.isAvailable === false) {
            return;
        }

        addToCart(item);
        showToast(`${item.name} added to your bucket.`);
    };

    const handleOrderNow = () => {
        if (!item || item.isAvailable === false) {
            return;
        }

        const productId = item._id || item.id;

        if (!productId) {
            showToast("Product ID is missing.", "error");
            return;
        }

        const imageUrl =
            typeof item.image === "string"
                ? item.image
                : item.image?.url || item.image?.secure_url || "";

        router.push({
            pathname: "/ordernow/[id]",
            params: {
                id: String(productId),
                name: item.name || "",
                price: String(item.price ?? 0),
                imageUrl,
            },
        });
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
                <StatusBar style="dark" backgroundColor="#FFFFFF" />
                <Navbar />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#F97316" />
                    <Text className="mt-3 text-sm text-gray-500">
                        Loading item...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!item) {
        return (
            <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
                <StatusBar style="dark" backgroundColor="#FFFFFF" />
                <Navbar />
                <View className="flex-1 items-center justify-center p-4">
                    <Ionicons
                        name="alert-circle-outline"
                        size={48}
                        color="#EF4444"
                    />
                    <Text className="mt-2 text-base font-bold text-gray-800">
                        Item Not Found
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mt-4 rounded-xl bg-gray-900 px-5 py-2.5"
                    >
                        <Text className="font-bold text-white">Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const imageUrl =
        typeof item.image === "string"
            ? item.image
            : item.image?.url || item.image?.secure_url;

    const isAvailable = item.isAvailable !== false;

    return (
        <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />

            <Navbar />

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

            <ScrollView
                className="flex-1 bg-white"
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="mb-5 flex-row items-center self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5"
                >
                    <Ionicons name="arrow-back" size={18} color="#111827" />
                    <Text className="ml-2 text-xs font-bold text-gray-900">
                        Back to Menu
                    </Text>
                </TouchableOpacity>

                {imageUrl ? (
                    <Image
                        source={{ uri: imageUrl }}
                        className="h-64 w-full rounded-2xl border border-gray-200 bg-gray-100"
                        resizeMode="cover"
                    />
                ) : (
                    <View className="h-64 w-full items-center justify-center rounded-2xl border border-gray-200 bg-gray-100">
                        <Ionicons
                            name="fast-food-outline"
                            size={48}
                            color="#9CA3AF"
                        />
                        <Text className="mt-2 text-xs text-gray-400">
                            No image available
                        </Text>
                    </View>
                )}

                <View className="mt-6">
                    <View className="flex-row items-start justify-between">
                        <Text className="mr-2 flex-1 text-2xl font-extrabold text-gray-900">
                            {item.name || "Menu Item"}
                        </Text>

                        <Text className="text-2xl font-extrabold text-orange-500">
                            Rs. {item.price ?? "N/A"}
                        </Text>
                    </View>

                    <View className="mt-4 flex-row items-center">
                        <View className="mr-2 rounded-lg border border-gray-200 bg-gray-100 px-3 py-1.5">
                            <Text className="text-xs font-bold text-gray-800">
                                {item.category || "General"}
                            </Text>
                        </View>

                        <View
                            className={`rounded-lg border px-3 py-1.5 ${
                                !isAvailable
                                    ? "border-red-200 bg-red-50"
                                    : "border-emerald-200 bg-emerald-50"
                            }`}
                        >
                            <Text
                                className={`text-xs font-bold ${
                                    !isAvailable
                                        ? "text-red-600"
                                        : "text-emerald-600"
                                }`}
                            >
                                {isAvailable ? "Available" : "Unavailable"}
                            </Text>
                        </View>
                    </View>

                    <View className="mt-6 border-t border-gray-100 pt-4">
                        <Text className="text-sm font-bold text-gray-800">
                            Description
                        </Text>
                        <Text className="mt-2 text-sm leading-6 text-gray-600">
                            {item.description || "No description provided."}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            <View className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between border-t border-gray-200 bg-white px-5 py-4 shadow-lg">
                <TouchableOpacity
                    onPress={handleAddToBucket}
                    disabled={!isAvailable}
                    className={`mr-2.5 flex-1 flex-row items-center justify-center rounded-xl border border-orange-500 py-3.5 ${
                        !isAvailable ? "opacity-50" : "bg-white"
                    }`}
                    activeOpacity={0.8}
                >
                    <Ionicons name="cart-outline" size={18} color="#F97316" />
                    <Text className="ml-2 font-bold text-orange-500">
                        Add to Bucket
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleOrderNow}
                    disabled={!isAvailable}
                    className={`ml-2.5 flex-1 flex-row items-center justify-center rounded-xl py-3.5 ${
                        !isAvailable ? "bg-gray-300" : "bg-orange-500"
                    }`}
                    activeOpacity={0.8}
                >
                    <Ionicons name="flash-outline" size={18} color="#FFFFFF" />
                    <Text className="ml-2 font-bold text-white">
                        Order Now
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default MenuItemDetail;