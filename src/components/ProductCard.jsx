import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useCart } from "../context/CartContext";
import Toast from "./Toast";

const ProductList = ({
    onAddToCart,
    onPressItem,
    title = "Hot Menu",
    selectedCategory = "All",
    searchQuery = "",
}) => {
    const router = useRouter();
    const { addToCart } = useCart();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState({
        visible: false,
        message: "",
        type: "success",
    });

    const apiUrl = (
        process.env.EXPO_PUBLIC_MENU_URL ||
        process.env.EXPO_PUBLIC_GET_MENU_URL ||
        ""
    ).trim();

    const fetchProducts = useCallback(async () => {
        if (!apiUrl) {
            setError("API URL is missing from environment variables.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(apiUrl, {
                headers: { Accept: "application/json" },
                withCredentials: true,
            });

            const data = response.data;
            let itemsList = [];

            if (Array.isArray(data)) {
                itemsList = data;
            } else if (Array.isArray(data?.data)) {
                itemsList = data.data;
            } else if (Array.isArray(data?.menu)) {
                itemsList = data.menu;
            } else if (Array.isArray(data?.items)) {
                itemsList = data.items;
            } else if (data && typeof data === "object") {
                const foundArray = Object.values(data).find((value) =>
                    Array.isArray(value)
                );

                if (foundArray) {
                    itemsList = foundArray;
                }
            }

            setProducts(itemsList);
        } catch (err) {
            console.error("Error fetching menu items:", err);

            setError(
                err.response?.data?.message ||
                    err.response?.data?.error ||
                    "Failed to load products."
            );
        } finally {
            setLoading(false);
        }
    }, [apiUrl]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const normalize = (value) =>
        String(value || "").trim().toLowerCase().replace(/\s+/g, " ");

    const category = normalize(selectedCategory);
    const query = normalize(searchQuery);

    const filteredProducts = products.filter((item) => {
        const matchesCategory =
            !category ||
            category === "all" ||
            normalize(item.category) === category;

        const searchableText = normalize(
            `${item.name || ""} ${item.category || ""} ${item.description || ""}`
        );

        const matchesSearch = !query || searchableText.includes(query);

        return matchesCategory && matchesSearch;
    });

    const getProductParams = (item) => ({
        id: String(item._id || item.id || ""),
        name: item.name || "",
        price: String(item.price ?? 0),
        imageUrl:
            item.image?.url ||
            (typeof item.image === "string" ? item.image : ""),
    });

    const handlePress = (item) => {
        if (typeof onPressItem === "function") {
            onPressItem(item);
            return;
        }

        router.push({
            pathname: "/details",
            params: getProductParams(item),
        });
    };

    const handleAddToCart = (item) => {
        if (item.isAvailable === false) {
            return;
        }

        addToCart(item);

        if (typeof onAddToCart === "function") {
            onAddToCart(item);
        }
    };

    const handleOrderNow = (item) => {
        if (item.isAvailable === false) {
            return;
        }

        const params = getProductParams(item);

        setToast({
            visible: true,
            message: `${item.name || "Product"} selected for ordering`,
            type: "success",
        });

        setTimeout(() => {
            setToast({
                visible: false,
                message: "",
                type: "success",
            });

            router.push({
                pathname: "/ordernow/[id]",
                params,
            });
        }, 1000);
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white py-12">
                <ActivityIndicator size="large" color="#2563EB" />
                <Text className="mt-3 text-xs font-semibold text-slate-700">
                    Loading menu items...
                </Text>
            </View>
        );
    }

    if (error) {
        return (
            <View className="mx-4 my-6 items-center justify-center rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                    <Ionicons
                        name="alert-circle-outline"
                        size={24}
                        color="#2563EB"
                    />
                </View>

                <Text className="mt-3 text-center text-xs font-bold text-slate-900">
                    {error}
                </Text>

                <TouchableOpacity
                    className="mt-4 rounded-xl bg-blue-600 px-6 py-3"
                    onPress={fetchProducts}
                    activeOpacity={0.8}
                >
                    <Text className="text-xs font-bold text-white">Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white px-5 pb-6">
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

            {title ? (
                <View className="mb-4 flex-row items-center justify-between">
                    <Text className="text-base font-extrabold text-slate-900">
                        {title}
                    </Text>
                </View>
            ) : null}

            {filteredProducts.length === 0 ? (
                <View className="my-6 items-center justify-center rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
                    <View className="h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                        <Ionicons
                            name="restaurant-outline"
                            size={26}
                            color="#2563EB"
                        />
                    </View>

                    <Text className="mt-4 text-sm font-bold text-slate-900">
                        No Menu Items Found
                    </Text>

                    <Text className="mt-1 text-center text-xs text-slate-500">
                        {query
                            ? `No products match "${searchQuery}".`
                            : category !== "all"
                            ? `No items found in category "${selectedCategory}".`
                            : "Please check back later."}
                    </Text>
                </View>
            ) : (
                <View className="flex-row flex-wrap justify-between">
                    {filteredProducts.map((item, index) => {
                        const imageUrl =
                            item.image?.url ||
                            (typeof item.image === "string"
                                ? item.image
                                : "");

                        const itemName = item.name || "";
                        const itemPrice = item.price ?? 0;
                        const isAvailable = item.isAvailable !== false;

                        return (
                            <View
                                key={item._id || item.id || index}
                                className="mb-4 w-[48%]"
                            >
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    onPress={() => handlePress(item)}
                                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                                >
                                    <View className="relative h-32 w-full bg-slate-100">
                                        {imageUrl ? (
                                            <Image
                                                source={{ uri: imageUrl }}
                                                className="h-full w-full"
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View className="h-full w-full items-center justify-center bg-blue-50">
                                                <Ionicons
                                                    name="fast-food-outline"
                                                    size={28}
                                                    color="#2563EB"
                                                />
                                            </View>
                                        )}
                                    </View>

                                    <View className="bg-white p-3">
                                        <Text
                                            className="text-xs font-bold text-slate-900"
                                            numberOfLines={1}
                                        >
                                            {itemName}
                                        </Text>

                                        <Text className="mt-1 text-sm font-extrabold text-[#F97316]">
                                            Rs. {itemPrice}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className={`mt-2 flex-row items-center justify-center rounded-2xl py-3 ${
                                        isAvailable
                                            ? "bg-blue-600"
                                            : "bg-slate-200"
                                    }`}
                                    onPress={() => handleOrderNow(item)}
                                    disabled={!isAvailable}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons
                                        name={
                                            isAvailable
                                                ? "flash-outline"
                                                : "ban-outline"
                                        }
                                        size={14}
                                        color={
                                            isAvailable ? "#FFFFFF" : "#64748B"
                                        }
                                    />

                                    <Text
                                        className={`ml-1.5 text-xs font-bold ${
                                            isAvailable
                                                ? "text-white"
                                                : "text-slate-500"
                                        }`}
                                    >
                                        {isAvailable ? "Order Now" : "N/A"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>
            )}
        </View>
    );
};

export default ProductList;