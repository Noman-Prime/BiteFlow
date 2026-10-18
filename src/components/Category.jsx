import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";

const Category = ({ selectedCategory, onSelectCategory }) => {
    const [categories, setCategories] = useState(["All"]);
    const [loading, setLoading] = useState(true);

    const apiUrl =
        process.env.EXPO_PUBLIC_MENU_URL ||
        process.env.EXPO_PUBLIC_GET_MENU_URL;

    const fetchCategories = useCallback(async () => {
        if (!apiUrl) {
            console.error("Menu API URL is missing.");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get(apiUrl, {
                headers: {
                    Accept: "application/json",
                },
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

            const uniqueCategories = [
                "All",
                ...new Set(
                    itemsList
                        .map((item) =>
                            typeof item?.category === "string"
                                ? item.category.trim()
                                : ""
                        )
                        .filter(Boolean)
                ),
            ];

            setCategories(uniqueCategories);
        } catch (error) {
            console.error(
                "Error fetching categories:",
                error.response?.data || error.message
            );
        } finally {
            setLoading(false);
        }
    }, [apiUrl]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    if (loading) {
        return (
            <View className="my-2 items-center justify-center py-2">
                <ActivityIndicator size="small" color="#2563EB" />
            </View>
        );
    }

    if (categories.length <= 1) {
        return null;
    }

    return (
        <View className="mb-4">
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: 20,
                }}
            >
                {categories.map((cat) => {
                    const isSelected = selectedCategory === cat;

                    return (
                        <Pressable
                            key={cat}
                            onPress={() => {
                                if (typeof onSelectCategory === "function") {
                                    onSelectCategory(cat);
                                }
                            }}
                            className={`mr-2.5 rounded-full px-5 py-2.5 border ${
                                isSelected
                                    ? "bg-blue-600 border-blue-600 shadow-sm"
                                    : "bg-slate-800 border-slate-700"
                            }`}
                        >
                            <Text
                                className={`text-xs font-bold ${
                                    isSelected ? "text-white" : "text-slate-300"
                                }`}
                            >
                                {cat}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
};

export default Category;