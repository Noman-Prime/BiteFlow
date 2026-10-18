import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import Navbar from "../../../components/Navbar";
import Toast from "../../../components/Toast";

const MenuItemDetails = () => {
    const params = useLocalSearchParams();
    const cleanId = Array.isArray(params.id) ? params.id[0] : params.id;
    const router = useRouter();

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [removeImage, setRemoveImage] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        price: "",
        category: "",
        description: "",
        isAvailable: true,
        image: null,
    });

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

    const getApiUrl = process.env.EXPO_PUBLIC_MENU_URL;
    const updateApiUrl = process.env.EXPO_PUBLIC_UPDATE_MENU_URL;
    const deleteApiUrl = process.env.EXPO_PUBLIC_DELETE_MENU_URL;

    const getEndpoint = (baseUrl) =>
        `${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(cleanId)}`;

    const mapMenuItem = (data) => {
        const menuItem = Array.isArray(data) ? data[0] : data;

        if (!menuItem?._id) {
            return false;
        }

        setItem(menuItem);
        setFormData({
            name: menuItem.name || "",
            price: String(menuItem.price ?? ""),
            category: menuItem.category || "",
            description: menuItem.description || "",
            isAvailable: menuItem.isAvailable !== false,
            image: menuItem.image || null,
        });

        setRemoveImage(false);
        return true;
    };

    // Fetch the menu item by ID
    const fetchMenuItem = useCallback(async () => {
        if (!cleanId || !getApiUrl) {
            setLoading(false);
            return false;
        }

        try {
            const token = await AsyncStorage.getItem("token");

            const response = await axios.get(getEndpoint(getApiUrl), {
                headers: {
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                withCredentials: true,
            });

            const data =
                response.data?.data ??
                response.data?.menuItem ??
                response.data?.item ??
                response.data;

            const mapped = mapMenuItem(data);

            if (!mapped) {
                setItem(null);
            }

            return mapped;
        } catch (error) {
            console.error(
                "Fetch menu item error:",
                error.response?.data || error.message
            );

            showToast(
                "error",
                error.response?.data?.message ||
                "Unable to load menu item details."
            );

            return false;
        } finally {
            setLoading(false);
        }
    }, [cleanId, getApiUrl]);

    useEffect(() => {
        fetchMenuItem();
    }, [fetchMenuItem]);

    const handlePickImage = async () => {
        try {
            const permission =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permission.granted) {
                showToast("error", "Photo library permission is required.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets?.length) {
                const asset = result.assets[0];
                const extension =
                    asset.uri.split(".").pop()?.split("?")[0] || "jpg";

                setFormData((prev) => ({
                    ...prev,
                    image: {
                        uri: asset.uri,
                        name: asset.fileName || `menu-${cleanId}.${extension}`,
                        type: asset.mimeType || `image/${extension}`,
                    },
                }));

                setRemoveImage(false);
            }
        } catch (error) {
            console.error("Image picker error:", error);
            showToast("error", "Unable to select image.");
        }
    };

    const handleRemoveImage = () => {
        setFormData((prev) => ({ ...prev, image: null }));
        setRemoveImage(true);
    };

    // Send updated form data matching payload structure with token auth
    const handleSaveUpdate = async () => {
        if (!formData.name.trim() || formData.price === "") {
            showToast("error", "Name and price are required.");
            return;
        }

        if (!Number.isFinite(Number(formData.price)) || Number(formData.price) < 0) {
            showToast("error", "Please enter a valid price.");
            return;
        }

        if (!cleanId || !updateApiUrl || !getApiUrl) {
            showToast("error", "API URL or product ID is missing.");
            return;
        }

        setUpdating(true);

        try {
            const token = await AsyncStorage.getItem("token");

            if (!token) {
                showToast("error", "Please log in again.");
                return;
            }

            const endpoint = getEndpoint(updateApiUrl);
            const payload = new FormData();

            payload.append("name", formData.name.trim());
            payload.append("price", String(Number(formData.price)));
            payload.append("category", formData.category);
            payload.append("description", formData.description);
            payload.append("isAvailable", String(formData.isAvailable));

            // Attach new image if a local file was picked
            if (formData.image?.uri && !formData.image?.url) {
                payload.append("image", {
                    uri: formData.image.uri,
                    name: formData.image.name || `menu-${cleanId}.jpg`,
                    type: formData.image.type || "image/jpeg",
                });
            }

            if (removeImage) {
                payload.append("removeImage", "true");
            }

            const response = await axios.put(endpoint, payload, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                withCredentials: true,
            });

            if (response.status !== 200 || response.data?.success === false) {
                throw new Error(
                    response.data?.message || "The server rejected the update."
                );
            }

            // Fetch the freshly updated record from backend database
            const refreshed = await fetchMenuItem();

            if (!refreshed) {
                showToast(
                    "error",
                    "Update response received, but reloading the saved item failed."
                );
                return;
            }

            setIsEditing(false);
            showToast("success", "Menu item updated successfully!");
        } catch (error) {
            console.error("Update failed:", {
                url: error.config?.url,
                status: error.response?.status,
                response: error.response?.data,
                message: error.message,
            });

            showToast(
                "error",
                error.response?.data?.message ||
                error.message ||
                "Failed to update menu item."
            );
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Menu Item",
            "Are you sure you want to delete this product? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        if (!deleteApiUrl) {
                            showToast("error", "Delete API URL is missing.");
                            return;
                        }

                        try {
                            setDeleting(true);
                            const token = await AsyncStorage.getItem("token");

                            if (!token) {
                                showToast("error", "Please log in again.");
                                return;
                            }

                            const response = await axios.delete(
                                getEndpoint(deleteApiUrl),
                                {
                                    headers: {
                                        Accept: "application/json",
                                        Authorization: `Bearer ${token}`,
                                    },
                                    withCredentials: true,
                                }
                            );

                            if (response.data?.success === false) {
                                showToast(
                                    "error",
                                    response.data?.message || "Failed to delete item."
                                );
                                return;
                            }

                            showToast("success", "Menu item deleted successfully!");

                            setTimeout(() => {
                                router.back();
                            }, 1500);
                        } catch (error) {
                            console.error(
                                "Delete menu item error:",
                                error.response?.data || error.message
                            );

                            showToast(
                                "error",
                                error.response?.data?.message || "Failed to delete item."
                            );
                        } finally {
                            setDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    const cancelEditing = async () => {
        setIsEditing(false);
        setRemoveImage(false);
        await fetchMenuItem();
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
                <StatusBar style="dark" backgroundColor="#FFFFFF" />
                <Navbar />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#F97316" />
                    <Text className="mt-3 text-sm text-gray-500">
                        Loading product details...
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
                <View className="flex-1 items-center justify-center px-6">
                    <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                    <Text className="mt-3 text-lg font-bold text-gray-900">
                        Product Not Found
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mt-5 rounded-xl bg-gray-900 px-6 py-3"
                    >
                        <Text className="font-bold text-white">Go Back</Text>
                    </TouchableOpacity>
                </View>
                <Toast
                    visible={toast.visible}
                    type={toast.type}
                    message={toast.message}
                    onHide={hideToast}
                />
            </SafeAreaView>
        );
    }

    const displayImageUrl =
        item.image?.url ||
        (typeof item.image === "string" ? item.image : null);

    const editPreviewUri =
        formData.image?.uri ||
        formData.image?.url ||
        (!removeImage ? displayImageUrl : null);

    return (
        <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />

            <Navbar />

            <KeyboardAwareScrollView
                className="flex-1 bg-white"
                contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
                enableOnAndroid
                enableAutomaticScroll
                extraScrollHeight={40}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="mb-5 flex-row items-center self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5"
                >
                    <Ionicons name="arrow-back" size={18} color="#111827" />
                    <Text className="ml-2 text-xs font-bold text-gray-900">
                        Back to Management
                    </Text>
                </TouchableOpacity>

                {/* Product image */}
                {!isEditing ? (
                    displayImageUrl ? (
                        <Image
                            source={{ uri: displayImageUrl }}
                            className="h-64 w-full rounded-2xl border border-gray-200 bg-gray-100"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="h-64 w-full items-center justify-center rounded-2xl border border-gray-200 bg-gray-100">
                            <Ionicons name="fast-food-outline" size={60} color="#9CA3AF" />
                            <Text className="mt-2 text-xs text-gray-400">
                                No image available
                            </Text>
                        </View>
                    )
                ) : (
                    <View className="mb-4">
                        <Text className="mb-2 text-xs font-bold text-gray-700">
                            Product Image
                        </Text>

                        {editPreviewUri ? (
                            <View className="relative h-64 w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                                <Image
                                    source={{ uri: editPreviewUri }}
                                    className="h-full w-full"
                                    resizeMode="cover"
                                />

                                <View className="absolute bottom-3 right-3 flex-row gap-2">
                                    <TouchableOpacity
                                        onPress={handlePickImage}
                                        className="flex-row items-center rounded-xl bg-gray-900 px-3.5 py-2"
                                    >
                                        <Ionicons name="camera-outline" size={16} color="#FFFFFF" />
                                        <Text className="ml-1.5 text-xs font-bold text-white">
                                            Change
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={handleRemoveImage}
                                        className="flex-row items-center rounded-xl bg-red-600 px-3.5 py-2"
                                    >
                                        <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                                        <Text className="ml-1.5 text-xs font-bold text-white">
                                            Remove
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <TouchableOpacity
                                onPress={handlePickImage}
                                className="h-44 w-full items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50"
                            >
                                <Ionicons name="image-outline" size={40} color="#9CA3AF" />
                                <Text className="mt-2 text-xs font-bold text-gray-600">
                                    Tap to add product image
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Product details */}
                {!isEditing ? (
                    <View className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
                        <View className="flex-row items-start justify-between">
                            <Text className="mr-2 flex-1 text-2xl font-extrabold text-gray-900">
                                {item.name}
                            </Text>
                            <Text className="text-2xl font-extrabold text-orange-500">
                                Rs. {item.price}
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
                                    item.isAvailable === false
                                        ? "border-red-200 bg-red-50"
                                        : "border-emerald-200 bg-emerald-50"
                                }`}
                            >
                                <Text
                                    className={`text-xs font-bold ${
                                        item.isAvailable === false
                                            ? "text-red-600"
                                            : "text-emerald-600"
                                    }`}
                                >
                                    {item.isAvailable === false ? "Unavailable" : "Available"}
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
                ) : (
                    <View className="mt-2 rounded-2xl border border-orange-200 bg-white p-5">
                        <Text className="mb-4 text-lg font-extrabold text-gray-900">
                            Edit Product Details
                        </Text>

                        <Text className="mb-1 text-xs font-bold text-gray-700">
                            Item Name
                        </Text>
                        <TextInput
                            value={formData.name}
                            onChangeText={(value) =>
                                setFormData((prev) => ({ ...prev, name: value }))
                            }
                            className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm text-gray-900"
                            placeholder="Enter item name"
                        />

                        <Text className="mb-1 text-xs font-bold text-gray-700">
                            Price (Rs.)
                        </Text>
                        <TextInput
                            value={formData.price}
                            onChangeText={(value) =>
                                setFormData((prev) => ({ ...prev, price: value }))
                            }
                            keyboardType="decimal-pad"
                            className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm text-gray-900"
                            placeholder="Enter price"
                        />

                        <Text className="mb-1 text-xs font-bold text-gray-700">
                            Category
                        </Text>
                        <TextInput
                            value={formData.category}
                            onChangeText={(value) =>
                                setFormData((prev) => ({ ...prev, category: value }))
                            }
                            className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm text-gray-900"
                            placeholder="Enter category"
                        />

                        <Text className="mb-1 text-xs font-bold text-gray-700">
                            Availability
                        </Text>
                        <TouchableOpacity
                            onPress={() =>
                                setFormData((prev) => ({
                                    ...prev,
                                    isAvailable: !prev.isAvailable,
                                }))
                            }
                            className={`mb-4 flex-row items-center justify-between rounded-xl border p-3 ${
                                formData.isAvailable
                                    ? "border-emerald-200 bg-emerald-50"
                                    : "border-red-200 bg-red-50"
                            }`}
                        >
                            <Text
                                className={`text-xs font-bold ${
                                    formData.isAvailable ? "text-emerald-700" : "text-red-700"
                                }`}
                            >
                                {formData.isAvailable ? "Available to Customers" : "Unavailable"}
                            </Text>
                            <Ionicons
                                name={formData.isAvailable ? "checkmark-circle" : "close-circle"}
                                size={20}
                                color={formData.isAvailable ? "#059669" : "#DC2626"}
                            />
                        </TouchableOpacity>

                        <Text className="mb-1 text-xs font-bold text-gray-700">
                            Description
                        </Text>
                        <TextInput
                            value={formData.description}
                            onChangeText={(value) =>
                                setFormData((prev) => ({ ...prev, description: value }))
                            }
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            className="min-h-[120px] rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm text-gray-900"
                            placeholder="Enter description"
                        />
                    </View>
                )}
            </KeyboardAwareScrollView>

            {/* Bottom action buttons */}
            <View className="flex-row items-center justify-between border-t border-gray-200 bg-white px-5 py-4">
                {!isEditing ? (
                    <>
                        <TouchableOpacity
                            onPress={() => {
                                setRemoveImage(false);
                                setIsEditing(true);
                            }}
                            className="mr-2.5 flex-1 flex-row items-center justify-center rounded-xl bg-orange-500 py-3.5"
                            activeOpacity={0.8}
                        >
                            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                            <Text className="ml-2 font-bold text-white">Update Item</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleDelete}
                            disabled={deleting}
                            className="ml-2.5 flex-1 flex-row items-center justify-center rounded-xl bg-red-600 py-3.5"
                            activeOpacity={0.8}
                        >
                            {deleting ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                                    <Text className="ml-2 font-bold text-white">Delete Item</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TouchableOpacity
                            onPress={handleSaveUpdate}
                            disabled={updating}
                            className="mr-2.5 flex-1 flex-row items-center justify-center rounded-xl bg-emerald-600 py-3.5"
                            activeOpacity={0.8}
                        >
                            {updating ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <Ionicons
                                        name="checkmark-circle-outline"
                                        size={18}
                                        color="#FFFFFF"
                                    />
                                    <Text className="ml-2 font-bold text-white">
                                        Save Changes
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={cancelEditing}
                            disabled={updating}
                            className="ml-2.5 flex-1 items-center justify-center rounded-xl bg-gray-200 py-3.5"
                            activeOpacity={0.8}
                        >
                            <Text className="font-bold text-gray-700">Cancel</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            <Toast
                visible={toast.visible}
                type={toast.type}
                message={toast.message}
                onHide={hideToast}
            />
        </SafeAreaView>
    );
};

MenuItemDetails.displayName = "MenuItemDetails";

export default MenuItemDetails;