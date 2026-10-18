
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

const Bucket = () => {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const {
        cartItems,
        isCartLoaded,
        updateQuantity,
        removeFromCart,
        subtotal,
    } = useCart();

    const [checkingOut, setCheckingOut] = useState(false);

    const deliveryFee = subtotal > 0 ? 150 : 0;
    const total = subtotal + deliveryFee;

    const handleCheckout = () => {
        if (cartItems.length === 0) {
            Alert.alert("Empty Bucket", "Please add products before checkout.");
            return;
        }

        if (!isAuthenticated) {
            router.push({
                pathname: "/signin",
                params: { redirect: "/(tabs)/checkout" },
            });
            return;
        }

        router.push("/(tabs)/checkout");
    };

    if (!isCartLoaded) {
        return (
            <SafeAreaView
                className="flex-1 items-center justify-center bg-white"
                edges={["top", "left", "right"]}
            >
                <ActivityIndicator size="large" color="#10B981" />
                <Text className="mt-3 text-xs text-gray-500">
                    Loading your bucket...
                </Text>
            </SafeAreaView>
        );
    }

    if (cartItems.length === 0) {
        return (
            <SafeAreaView
                className="flex-1 bg-white"
                edges={["top", "left", "right"]}
            >
                <View className="bg-gray-900 px-5 py-4">
                    <Text className="text-base font-extrabold text-white">
                        My Bucket
                    </Text>
                </View>

                <View className="flex-1 items-center justify-center p-6">
                    <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50">
                        <Ionicons
                            name="basket-outline"
                            size={32}
                            color="#10B981"
                        />
                    </View>

                    <Text className="text-base font-bold text-black">
                        Your bucket is empty
                    </Text>

                    <Text className="mt-1 text-center text-xs text-gray-500">
                        Explore our menu and add items to your bucket to get
                        started.
                    </Text>

                    <TouchableOpacity
                        onPress={() => router.push("/(tabs)")}
                        className="mt-6 rounded-2xl bg-emerald-600 px-6 py-3.5 shadow-sm shadow-emerald-200"
                        activeOpacity={0.8}
                    >
                        <Text className="text-xs font-bold text-white">
                            Browse Menu
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            className="flex-1 bg-white"
            edges={["top", "left", "right"]}
        >
            <View className="bg-gray-900 px-5 py-4">
                <Text className="text-base font-extrabold text-white">
                    My Bucket
                </Text>
                <Text className="mt-0.5 text-[10px] font-semibold text-gray-400">
                    Review your selected items before checkout
                </Text>
            </View>

            <ScrollView
                className="flex-1 px-5 pt-4"
                contentContainerStyle={{ paddingBottom: 150 }}
                showsVerticalScrollIndicator={false}
            >
                {cartItems.map((item) => (
                    <View
                        key={item.id}
                        className="mb-3.5 flex-row items-center rounded-3xl border border-gray-100 bg-white p-3 shadow-sm"
                    >
                        {item.image ? (
                            <Image
                                source={{ uri: item.image }}
                                className="h-16 w-16 rounded-2xl bg-gray-50"
                                resizeMode="cover"
                            />
                        ) : (
                            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                                <Ionicons
                                    name="fast-food-outline"
                                    size={26}
                                    color="#10B981"
                                />
                            </View>
                        )}

                        <View className="ml-3 flex-1 pr-2">
                            <Text
                                className="text-xs font-bold text-black"
                                numberOfLines={2}
                            >
                                {item.name}
                            </Text>

                            <Text className="mt-1 text-sm font-extrabold text-orange-600">
                                Rs. {item.price * item.quantity}
                            </Text>

                            <TouchableOpacity
                                onPress={() => removeFromCart(item.id)}
                                className="mt-1 self-start"
                                activeOpacity={0.7}
                            >
                                <Text className="text-[10px] font-semibold text-red-500">
                                    Remove
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row items-center rounded-xl border border-gray-100 bg-gray-50 p-1">
                            <TouchableOpacity
                                onPress={() => updateQuantity(item.id, -1)}
                                className="h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm"
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name="remove"
                                    size={14}
                                    color="#000000"
                                />
                            </TouchableOpacity>

                            <Text className="px-2.5 text-xs font-bold text-black">
                                {item.quantity}
                            </Text>

                            <TouchableOpacity
                                onPress={() => updateQuantity(item.id, 1)}
                                className="h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 shadow-sm"
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name="add"
                                    size={14}
                                    color="#FFFFFF"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

                <View className="mb-6 mt-4 rounded-3xl border border-gray-100 bg-gray-50 p-4">
                    <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-black">
                        Order Summary
                    </Text>

                    <View className="mb-2 flex-row justify-between">
                        <Text className="text-xs text-gray-600">
                            Subtotal
                        </Text>
                        <Text className="text-xs font-bold text-black">
                            Rs. {subtotal}
                        </Text>
                    </View>

                    <View className="mb-3 flex-row justify-between border-b border-gray-200 pb-3">
                        <Text className="text-xs text-gray-600">
                            Delivery Fee
                        </Text>
                        <Text className="text-xs font-bold text-black">
                            Rs. {deliveryFee}
                        </Text>
                    </View>

                    <View className="flex-row justify-between">
                        <Text className="text-sm font-extrabold text-black">
                            Total Amount
                        </Text>
                        <Text className="text-sm font-extrabold text-orange-600">
                            Rs. {total}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            <View className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-5 py-4 shadow-lg">
                <TouchableOpacity
                    onPress={handleCheckout}
                    disabled={checkingOut}
                    activeOpacity={0.8}
                    className="w-full flex-row items-center justify-center rounded-2xl bg-emerald-600 py-4 shadow-sm shadow-emerald-200"
                >
                    {checkingOut ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <Ionicons
                                name="card-outline"
                                size={18}
                                color="#FFFFFF"
                            />
                            <Text className="ml-2 text-xs font-bold text-white">
                                Proceed to Checkout • Rs. {total}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default Bucket;