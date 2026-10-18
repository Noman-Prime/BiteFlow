import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Navbar from "../../components/Navbar";
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
                className="flex-1 items-center justify-center bg-[#F8FAFC]"
                edges={["top"]}
            >
                <StatusBar style="dark" backgroundColor="#FFFFFF" />
                <ActivityIndicator size="large" color="#2563EB" />
                <Text className="mt-3 text-xs font-bold text-[#64748B]">
                    Loading your bucket...
                </Text>
            </SafeAreaView>
        );
    }

    if (cartItems.length === 0) {
        return (
            <SafeAreaView
                className="flex-1 bg-[#F8FAFC]"
                edges={["top"]}
            >
                <StatusBar style="dark" backgroundColor="#FFFFFF" />

                <View className="bg-white pb-2 pt-1 border-b border-[#F1F5F9]">
                    <Navbar />
                </View>

                <View className="flex-1 items-center justify-center p-6">
                    <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl border border-[#DBEAFE] bg-[#EFF6FF]">
                        <Ionicons
                            name="basket-outline"
                            size={36}
                            color="#2563EB"
                        />
                    </View>

                    <Text className="text-base font-extrabold text-[#0F172A]">
                        Your bucket is empty
                    </Text>

                    <Text className="mt-1 text-center text-xs text-[#64748B]">
                        Explore our menu and add items to your bucket to get
                        started.
                    </Text>

                    <TouchableOpacity
                        onPress={() => router.push("/(tabs)")}
                        className="mt-6 rounded-2xl bg-[#2563EB] px-6 py-3.5 shadow-sm"
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
            className="flex-1 bg-[#F8FAFC]"
            edges={["top"]}
        >
            <StatusBar style="dark" backgroundColor="#FFFFFF" />

            <View className="bg-white pb-2 pt-1 border-b border-[#F1F5F9]">
                <Navbar />
            </View>

            <View className="bg-white px-5 py-3 border-b border-[#F1F5F9]">
                <Text className="text-xl font-black text-[#0F172A]">
                    My Bucket
                </Text>
                <Text className="mt-0.5 text-xs text-[#64748B]">
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
                        className="mb-3.5 flex-row items-center rounded-3xl border border-[#DBEAFE] bg-white p-3 shadow-sm"
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

                        <View className="ml-3 flex-1 pr-2">
                            <Text
                                className="text-xs font-bold text-[#0F172A]"
                                numberOfLines={2}
                            >
                                {item.name}
                            </Text>

                            <Text className="mt-1 text-xs font-black text-[#2563EB]">
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

                        <View className="flex-row items-center rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] p-1">
                            <TouchableOpacity
                                onPress={() => updateQuantity(item.id, -1)}
                                className="h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm border border-[#DBEAFE]"
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name="remove"
                                    size={14}
                                    color="#2563EB"
                                />
                            </TouchableOpacity>

                            <Text className="px-2.5 text-xs font-bold text-[#0F172A]">
                                {item.quantity}
                            </Text>

                            <TouchableOpacity
                                onPress={() => updateQuantity(item.id, 1)}
                                className="h-7 w-7 items-center justify-center rounded-lg bg-[#2563EB] shadow-sm"
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

                <View className="mb-6 mt-4 rounded-3xl border border-[#DBEAFE] bg-white p-4 shadow-sm">
                    <Text className="mb-3 text-xs font-black uppercase tracking-wider text-[#0F172A]">
                        Order Summary
                    </Text>

                    <View className="mb-2 flex-row justify-between">
                        <Text className="text-xs text-[#64748B]">
                            Subtotal
                        </Text>
                        <Text className="text-xs font-bold text-[#0F172A]">
                            Rs. {subtotal}
                        </Text>
                    </View>

                    <View className="mb-3 flex-row justify-between border-b border-[#F1F5F9] pb-3">
                        <Text className="text-xs text-[#64748B]">
                            Delivery Fee
                        </Text>
                        <Text className="text-xs font-bold text-[#0F172A]">
                            Rs. {deliveryFee}
                        </Text>
                    </View>

                    <View className="flex-row justify-between">
                        <Text className="text-sm font-black text-[#0F172A]">
                            Total Amount
                        </Text>
                        <Text className="text-sm font-black text-[#2563EB]">
                            Rs. {total}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            <View className="absolute bottom-0 left-0 right-0 border-t border-[#F1F5F9] bg-white px-5 py-4 shadow-lg">
                <TouchableOpacity
                    onPress={handleCheckout}
                    disabled={checkingOut}
                    activeOpacity={0.8}
                    className="w-full flex-row items-center justify-center rounded-2xl bg-[#2563EB] py-4 shadow-sm"
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