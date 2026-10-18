import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Navbar from "../../../components/Navbar";
import Toast from "../../../components/Toast";
import { useAuth } from "../../../context/AuthContext";

const CATEGORIES = ["Mains", "Starters", "Desserts", "Drinks", "Sides"];
const API_URL = process.env.EXPO_PUBLIC_NEW_MENU_URL;

const AddMenu = () => {
    const router = useRouter();
    const { user } = useAuth();
    const { width } = useWindowDimensions();

    const isDesktop = width >= 768;

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("Mains");
    const [image, setImage] = useState(null);
    const [isAvailable, setIsAvailable] = useState(true);
    const [loading, setLoading] = useState(false);

    // Toast Notification State
    const [toast, setToast] = useState({
        visible: false,
        type: "success",
        message: "",
    });

    const showToast = (type, message) => {
        setToast({ visible: true, type, message });
    };

    const hideToast = () => {
        setToast((prev) => ({ ...prev, visible: false }));
    };

    const pickImage = async () => {
        try {
            const permission =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permission.granted) {
                showToast(
                    "error",
                    "Please allow photo library access to select a food image."
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets?.[0]) {
                setImage(result.assets[0]);
            }
        } catch {
            showToast("error", "Unable to open the image library.");
        }
    };

    const handleCreateMenu = async () => {
        if (loading) return;

        if (
            !name.trim() ||
            !description.trim() ||
            !price.trim() ||
            !category ||
            !image
        ) {
            showToast(
                "error",
                "Please complete all required fields and select a food image."
            );
            return;
        }

        const numericPrice = Number(price);

        if (!Number.isFinite(numericPrice) || numericPrice < 0) {
            showToast(
                "error",
                "Price must be a valid number greater than or equal to zero."
            );
            return;
        }

        if (!API_URL) {
            showToast(
                "error",
                "Please configure EXPO_PUBLIC_NEW_MENU_URL in your .env file."
            );
            return;
        }

        const formData = new FormData();

        formData.append("name", name.trim());
        formData.append("description", description.trim());
        formData.append("price", String(numericPrice));
        formData.append("category", category);
        formData.append("isAvailable", String(isAvailable));

        const fileName =
            image.fileName || image.uri.split("/").pop() || "food-image.jpg";

        const extension = fileName.split(".").pop()?.toLowerCase();

        const mimeType =
            image.mimeType ||
            (extension === "png"
                ? "image/png"
                : extension === "webp"
                ? "image/webp"
                : "image/jpeg");

        formData.append("image", {
            uri: image.uri,
            name: fileName,
            type: mimeType,
        });

        try {
            setLoading(true);

            const token =
                user?.token ||
                user?.accessToken ||
                user?.data?.token;

            const response = await axios.post(API_URL, formData, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                timeout: 30000,
            });

            showToast(
                "success",
                response.data?.message || "Menu item created successfully."
            );

            setName("");
            setDescription("");
            setPrice("");
            setCategory("Mains");
            setImage(null);
            setIsAvailable(true);
            setLoading(false);

            setTimeout(() => {
                router.replace("/admin/menu");
            }, 1500);
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.response?.data?.error ||
                (error.code === "ECONNABORTED"
                    ? "The request timed out. Please try again."
                    : error.message) ||
                "Failed to create menu item.";

            showToast("error", message);
            setLoading(false);
        }
    };

    const renderInput = ({
        label,
        value,
        onChangeText,
        placeholder,
        multiline = false,
        keyboardType = "default",
    }) => (
        <View className="mb-5">
            <Text className="mb-2 text-xs font-bold text-[#0F172A]">
                {label}
            </Text>

            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#94A3B8"
                multiline={multiline}
                keyboardType={keyboardType}
                editable={!loading}
                className={`w-full rounded-2xl border border-[#DBEAFE] bg-[#EFF6FF] px-4 py-3.5 text-xs font-medium text-[#0F172A] ${
                    multiline ? "min-h-28" : "h-14"
                }`}
                style={multiline ? { textAlignVertical: "top" } : undefined}
            />
        </View>
    );

    return (
        <SafeAreaView
            className="flex-1 bg-[#F8FAFC]"
            edges={["top"]}
        >
            <StatusBar style="dark" backgroundColor="#FFFFFF" />

            <View className="bg-white pb-2 pt-1 border-b border-[#F1F5F9]">
                <Navbar />
            </View>

            {/* Floating Toast Wrapper positioned right below the navbar */}
            <View className="absolute left-5 right-5 top-20 z-50">
                <Toast
                    visible={toast.visible}
                    type={toast.type}
                    message={toast.message}
                    onHide={hideToast}
                />
            </View>

            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{
                        flexGrow: 1,
                        alignItems: "center",
                        paddingHorizontal: isDesktop ? 32 : 20,
                        paddingTop: 24,
                        paddingBottom: 48,
                    }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View className="w-full" style={{ maxWidth: 760 }}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="mb-4 flex-row items-center self-start"
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={20} color="#2563EB" />
                            <Text className="ml-2 text-xs font-bold text-[#2563EB]">
                                Back to Menu
                            </Text>
                        </TouchableOpacity>

                        <View className="mb-6">
                            <Text className="text-2xl font-black text-[#0F172A]">
                                Add Menu Item
                            </Text>
                            <Text className="mt-1 text-xs text-[#64748B]">
                                Add food information and select an image.
                            </Text>
                        </View>

                        <View className="rounded-3xl border border-[#DBEAFE] bg-white p-5 shadow-sm">
                            <View className="mb-6 flex-row items-center">
                                <View className="mr-3 h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE]">
                                    <Ionicons
                                        name="restaurant-outline"
                                        size={24}
                                        color="#2563EB"
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-base font-black text-[#0F172A]">
                                        Food Details
                                    </Text>
                                    <Text className="mt-0.5 text-xs text-[#64748B]">
                                        Complete all required fields.
                                    </Text>
                                </View>
                            </View>

                            {renderInput({
                                label: "Food Name *",
                                value: name,
                                onChangeText: setName,
                                placeholder: "e.g. Chicken Burger",
                            })}

                            {renderInput({
                                label: "Description *",
                                value: description,
                                onChangeText: setDescription,
                                placeholder: "Describe the food item...",
                                multiline: true,
                            })}

                            {renderInput({
                                label: "Price (PKR) *",
                                value: price,
                                onChangeText: setPrice,
                                placeholder: "e.g. 650",
                                keyboardType: "decimal-pad",
                            })}

                            <View className="mb-5">
                                <Text className="mb-2 text-xs font-bold text-[#0F172A]">
                                    Category *
                                </Text>

                                <View className="flex-row flex-wrap gap-2">
                                    {CATEGORIES.map((item) => {
                                        const selected = category === item;

                                        return (
                                            <TouchableOpacity
                                                key={item}
                                                onPress={() => setCategory(item)}
                                                disabled={loading}
                                                className={`rounded-2xl border px-4 py-2.5 ${
                                                    selected
                                                        ? "border-[#2563EB] bg-[#EFF6FF]"
                                                        : "border-[#DBEAFE] bg-white"
                                                }`}
                                                activeOpacity={0.75}
                                            >
                                                <Text
                                                    className={`text-xs font-bold ${
                                                        selected
                                                            ? "text-[#2563EB]"
                                                            : "text-[#64748B]"
                                                    }`}
                                                >
                                                    {item}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            <View className="mb-5">
                                <Text className="mb-2 text-xs font-bold text-[#0F172A]">
                                    Food Image *
                                </Text>

                                {image ? (
                                    <View>
                                        <Image
                                            source={{ uri: image.uri }}
                                            className="h-56 w-full rounded-2xl bg-[#EFF6FF]"
                                            resizeMode="cover"
                                        />

                                        <TouchableOpacity
                                            onPress={pickImage}
                                            disabled={loading}
                                            className="mt-3 flex-row items-center justify-center rounded-2xl border border-[#DBEAFE] bg-[#EFF6FF] px-4 py-3"
                                            activeOpacity={0.75}
                                        >
                                            <Ionicons
                                                name="image-outline"
                                                size={18}
                                                color="#2563EB"
                                            />
                                            <Text className="ml-2 text-xs font-bold text-[#2563EB]">
                                                Change Image
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        onPress={pickImage}
                                        disabled={loading}
                                        className="items-center justify-center rounded-2xl border-2 border-dashed border-[#DBEAFE] bg-[#EFF6FF] px-4 py-8"
                                        activeOpacity={0.75}
                                    >
                                        <View className="mb-3 h-14 w-14 items-center justify-center rounded-2xl bg-white border border-[#DBEAFE]">
                                            <Ionicons
                                                name="cloud-upload-outline"
                                                size={26}
                                                color="#2563EB"
                                            />
                                        </View>
                                        <Text className="text-xs font-bold text-[#0F172A]">
                                            Select Food Image
                                        </Text>
                                        <Text className="mt-1 text-center text-[10px] text-[#64748B]">
                                            Choose a photo from your device
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View className="mb-6 flex-row items-center justify-between rounded-2xl border border-[#DBEAFE] bg-[#EFF6FF] p-4">
                                <View className="flex-1 pr-3">
                                    <Text className="text-xs font-bold text-[#0F172A]">
                                        Available for ordering
                                    </Text>
                                    <Text className="mt-0.5 text-[10px] text-[#64748B]">
                                        Allow customers to order this item.
                                    </Text>
                                </View>
                                <Switch
                                    value={isAvailable}
                                    onValueChange={setIsAvailable}
                                    disabled={loading}
                                    trackColor={{
                                        false: "#CBD5E1",
                                        true: "#2563EB",
                                    }}
                                    thumbColor={isAvailable ? "#FFFFFF" : "#F1F5F9"}
                                />
                            </View>

                            <TouchableOpacity
                                onPress={handleCreateMenu}
                                disabled={loading}
                                className={`flex-row items-center justify-center rounded-2xl px-5 py-4 shadow-sm ${
                                    loading ? "bg-blue-300" : "bg-[#2563EB]"
                                }`}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Ionicons
                                        name="add-circle-outline"
                                        size={20}
                                        color="#FFFFFF"
                                    />
                                )}
                                <Text className="ml-2 text-xs font-bold text-white">
                                    {loading ? "Creating Menu..." : "Create Menu"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default AddMenu;