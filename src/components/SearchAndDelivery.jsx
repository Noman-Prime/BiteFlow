import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

const SearchAndDelivery = ({ onSearch }) => {
    const [search, setSearch] = useState("");

    const handleSearch = (text) => {
        setSearch(text);

        if (typeof onSearch === "function") {
            onSearch(text);
        }
    };

    return (
        <View className="border-b border-gray-800 bg-gray-900 px-5 py-4">
            <View className="mb-3.5 flex-row items-center">
                <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
                    <Ionicons name="location-outline" size={18} color="#10B981" />
                </View>

                <View className="flex-1">
                    <Text className="text-[10px] font-bold uppercase text-gray-400">
                        Deliver to
                    </Text>

                    <TouchableOpacity
                        className="mt-0.5 flex-row items-center"
                        activeOpacity={0.8}
                        onPress={() => console.log("Delivery location selected")}
                    >
                        <Text className="mr-1.5 text-xs font-bold text-white" numberOfLines={1}>
                            Rawalpindi, Islamabad, Pakistan
                        </Text>
                        <Ionicons name="chevron-down" size={13} color="#F97316" />
                    </TouchableOpacity>
                </View>
            </View>

            <View className="flex-row items-center rounded-2xl border border-gray-100 bg-white px-3.5 py-1.5 shadow-sm">
                <Ionicons name="search-outline" size={18} color="#9CA3AF" />

                <TextInput
                    className="h-11 flex-1 px-2 text-xs font-semibold text-black"
                    placeholder="Search food, restaurants..."
                    placeholderTextColor="#9CA3AF"
                    value={search}
                    onChangeText={handleSearch}
                    returnKeyType="search"
                    accessibilityLabel="Search food and restaurants"
                />

                {search.length > 0 && (
                    <TouchableOpacity
                        onPress={() => handleSearch("")}
                        className="mr-2"
                    >
                        <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    onPress={() => onSearch?.(search.trim())}
                    activeOpacity={0.8}
                    className="rounded-xl bg-blue-600 px-4 py-2.5"
                >
                    <Text className="text-xs font-bold text-white">Search</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default SearchAndDelivery;