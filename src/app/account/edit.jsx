import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
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
import { useAuth } from "../../context/AuthContext";

const EditAccount = () => {
    const router = useRouter();
    const { user, isAuthenticated, login } = useAuth();

    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [profileImage, setProfileImage] = useState(
        typeof user?.profileImage === "string"
            ? user.profileImage
            : user?.profileImage?.url || user?.profileImage?.secure_url || ""
    );
    const [selectedImage, setSelectedImage] = useState(null);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [toast, setToast] = useState({
        visible: false,
        type: "success",
        message: "",
    });

    useEffect(() => {
        setName(user?.name || "");
        setEmail(user?.email || "");
        setProfileImage(
            typeof user?.profileImage === "string"
                ? user.profileImage
                : user?.profileImage?.url ||
                    user?.profileImage?.secure_url ||
                    ""
        );
    }, [user]);

    const showToast = (type, message) => {
        setToast({ visible: true, type, message });
    };

    const hideToast = () => {
        setToast((prev) => ({ ...prev, visible: false }));
    };

    const getToken = async () => {
        const token = await AsyncStorage.getItem("token");

        if (!token) {
            throw new Error("Your session has expired. Please sign in again.");
        }

        return token;
    };

    const getImageUrl = (image) => {
        if (typeof image === "string") {
            return image;
        }

        return image?.url || image?.secure_url || "";
    };

    const pickImage = async () => {
        try {
            const permission =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permission.granted) {
                showToast("error", "Please allow access to your photos.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets?.length > 0) {
                setSelectedImage(result.assets[0]);
            }
        } catch (error) {
            showToast("error", "Unable to select image.");
        }
    };

    const handleSave = async () => {
        if (!name.trim() || !email.trim()) {
            showToast("error", "Please enter your name and email.");
            return;
        }

        if (!user?._id) {
            showToast(
                "error",
                "User information is missing. Please sign in again."
            );
            return;
        }

        const updateUrl = process.env.EXPO_PUBLIC_UPDATE_USER_URL;

        if (!updateUrl) {
            showToast("error", "User update API URL is not configured.");
            return;
        }

        try {
            setSaving(true);

            const token = await getToken();

            const response = await axios.put(
                `${updateUrl.replace(/\/+$/, "")}/${user._id}`,
                {
                    name: name.trim(),
                    email: email.trim(),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    withCredentials: true,
                }
            );

            const updatedUser =
                response.data.user ||
                response.data.User ||
                response.data.updatedUser ||
                {};

            login({
                ...user,
                ...updatedUser,
                name: updatedUser.name || name.trim(),
                email: updatedUser.email || email.trim(),
            });

            showToast("success", "Profile details updated successfully.");

            setTimeout(() => {
                router.replace("/account");
            }, 1500);
        } catch (error) {
            showToast(
                "error",
                error.response?.data?.message ||
                    error.message ||
                    "Unable to update profile."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async () => {
        if (!selectedImage?.uri) {
            showToast("error", "Please select an image first.");
            return;
        }

        const uploadUrl = process.env.EXPO_PUBLIC_PROFILE_IMAGE_URL;

        if (!uploadUrl) {
            showToast("error", "Profile image API URL is not configured.");
            return;
        }

        try {
            setUploadingImage(true);

            const token = await getToken();

            const uri = selectedImage.uri;
            const originalName =
                selectedImage.fileName || uri.split("/").pop() || "profile.jpg";
            const extension = originalName.split(".").pop()?.toLowerCase();

            const mimeTypes = {
                jpg: "image/jpeg",
                jpeg: "image/jpeg",
                png: "image/png",
                webp: "image/webp",
                heic: "image/heic",
                heif: "image/heif",
            };

            const mimeType =
                selectedImage.mimeType ||
                mimeTypes[extension] ||
                "image/jpeg";

            const fileName = originalName.includes(".")
                ? originalName
                : `profile.${mimeType.split("/")[1] === "jpeg" ? "jpg" : mimeType.split("/")[1]}`;

            const formData = new FormData();

            formData.append("image", {
                uri,
                name: fileName,
                type: mimeType,
            });

            const response = await axios.put(
                uploadUrl,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    withCredentials: true,
                }
            );

            const updatedUser =
                response.data.user ||
                response.data.User ||
                response.data.updatedUser ||
                {};

            const returnedImage = getImageUrl(updatedUser.profileImage);

            const newProfileImage =
                returnedImage ||
                getImageUrl(response.data.profileImage) ||
                uri;

            setProfileImage(newProfileImage);
            setSelectedImage(null);

            login({
                ...user,
                ...updatedUser,
                profileImage: updatedUser.profileImage || newProfileImage,
            });

            showToast("success", "Profile image updated successfully.");

            setTimeout(() => {
                router.replace("/account");
            }, 1500);
        } catch (error) {
            showToast(
                "error",
                error.response?.data?.message ||
                    error.message ||
                    "Unable to upload profile image."
            );
        } finally {
            setUploadingImage(false);
        }
    };

    if (!isAuthenticated || !user) {
        return (
            <SafeAreaView
                className="flex-1 bg-[#F8FAFC]"
                edges={["top", "left", "right"]}
            >
                <StatusBar style="dark" backgroundColor="#FFFFFF" />
                <Navbar />

                <View className="flex-1 items-center justify-center px-6">
                    <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl border border-[#DBEAFE] bg-[#EFF6FF]">
                        <Ionicons
                            name="lock-closed-outline"
                            size={30}
                            color="#2563EB"
                        />
                    </View>

                    <Text className="text-lg font-extrabold text-[#0F172A]">
                        Sign In Required
                    </Text>

                    <Text className="mt-2 text-center text-sm text-[#64748B]">
                        Please sign in to edit your account.
                    </Text>

                    <TouchableOpacity
                        onPress={() => router.replace("/signin")}
                        activeOpacity={0.8}
                        className="mt-6 w-full flex-row items-center justify-center rounded-2xl bg-[#2563EB] py-4 shadow-sm"
                    >
                        <Text className="font-bold text-white text-xs">Sign In</Text>
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

    return (
        <SafeAreaView
            className="flex-1 bg-[#F8FAFC]"
            edges={["top", "left", "right"]}
        >
            <StatusBar style="dark" backgroundColor="#FFFFFF" />
            <Navbar />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="rounded-b-[36px] bg-[#2563EB] px-6 pb-12 pt-6 shadow-sm">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        activeOpacity={0.7}
                        className="mb-5 h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/15"
                    >
                        <Ionicons
                            name="arrow-back"
                            size={20}
                            color="#FFFFFF"
                        />
                    </TouchableOpacity>

                    <Text className="text-2xl font-black tracking-tight text-white">
                        Edit Profile
                    </Text>

                    <Text className="mt-1 text-xs font-semibold text-blue-100">
                        Update your personal information
                    </Text>
                </View>

                <View className="-mt-8 px-5">
                    <View className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
                        <View className="items-center">
                            <View className="relative">
                                {selectedImage?.uri || profileImage ? (
                                    <Image
                                        source={{
                                            uri:
                                                selectedImage?.uri ||
                                                profileImage,
                                        }}
                                        className="h-28 w-28 rounded-3xl border-2 border-[#2563EB]"
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View className="h-28 w-28 items-center justify-center rounded-3xl border-2 border-[#DBEAFE] bg-[#EFF6FF]">
                                        <Text className="text-4xl font-black text-[#2563EB]">
                                            {name.trim().charAt(0).toUpperCase() ||
                                                "U"}
                                        </Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    onPress={pickImage}
                                    disabled={uploadingImage || saving}
                                    activeOpacity={0.8}
                                    className="absolute -bottom-2 -right-2 h-10 w-10 items-center justify-center rounded-2xl border-2 border-white bg-[#2563EB] shadow-sm"
                                >
                                    <Ionicons
                                        name="camera-outline"
                                        size={20}
                                        color="#FFFFFF"
                                    />
                                </TouchableOpacity>
                            </View>

                            <Text className="mt-4 text-base font-extrabold text-[#0F172A]">
                                {name || "BiteFlow User"}
                            </Text>

                            <Text className="mt-1 text-xs text-[#64748B]">
                                {email}
                            </Text>

                            <TouchableOpacity
                                onPress={pickImage}
                                disabled={uploadingImage || saving}
                                activeOpacity={0.8}
                                className="mt-4 rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] px-5 py-3"
                            >
                                <Text className="text-xs font-bold text-[#2563EB]">
                                    Choose Profile Photo
                                </Text>
                            </TouchableOpacity>

                            {selectedImage && (
                                <TouchableOpacity
                                    onPress={handleImageUpload}
                                    disabled={uploadingImage || saving}
                                    activeOpacity={0.8}
                                    className="mt-3 w-full flex-row items-center justify-center rounded-2xl bg-[#2563EB] py-3.5 shadow-sm"
                                >
                                    {uploadingImage ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Ionicons
                                            name="cloud-upload-outline"
                                            size={17}
                                            color="#FFFFFF"
                                        />
                                    )}

                                    <Text className="ml-2 text-xs font-bold text-white">
                                        {uploadingImage
                                            ? "Uploading Photo..."
                                            : "Upload Profile Photo"}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View className="mt-8">
                            <Text className="mb-2 text-xs font-bold text-[#64748B]">
                                Full Name
                            </Text>

                            <View className="flex-row items-center rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4">
                                <Ionicons
                                    name="person-outline"
                                    size={18}
                                    color="#94A3B8"
                                />

                                <TextInput
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Enter your full name"
                                    placeholderTextColor="#94A3B8"
                                    autoCapitalize="words"
                                    className="ml-3 flex-1 py-4 text-xs font-extrabold text-[#0F172A]"
                                />
                            </View>

                            <Text className="mb-2 mt-5 text-xs font-bold text-[#64748B]">
                                Email Address
                            </Text>

                            <View className="flex-row items-center rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4">
                                <Ionicons
                                    name="mail-outline"
                                    size={18}
                                    color="#94A3B8"
                                />

                                <TextInput
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="Enter your email"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    className="ml-3 flex-1 py-4 text-xs font-extrabold text-[#0F172A]"
                                />
                            </View>

                            <Text className="mb-2 mt-5 text-xs font-bold text-[#64748B]">
                                Account Role
                            </Text>

                            <View className="flex-row items-center rounded-2xl border border-[#E2E8F0] bg-[#F1F5F9] px-4 py-4">
                                <Ionicons
                                    name="shield-checkmark-outline"
                                    size={18}
                                    color="#94A3B8"
                                />

                                <Text className="ml-3 text-xs font-extrabold text-[#64748B]">
                                    {user.role || "Customer"}
                                </Text>

                                <View className="ml-auto">
                                    <Ionicons
                                        name="lock-closed-outline"
                                        size={16}
                                        color="#94A3B8"
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={saving || uploadingImage}
                                activeOpacity={0.8}
                                className="mt-8 flex-row items-center justify-center rounded-2xl bg-[#2563EB] py-4 shadow-sm"
                            >
                                {saving ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Ionicons
                                        name="save-outline"
                                        size={18}
                                        color="#FFFFFF"
                                    />
                                )}

                                <Text className="ml-2 text-xs font-bold text-white">
                                    {saving
                                        ? "Saving Changes..."
                                        : "Save Changes"}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.back()}
                                disabled={saving || uploadingImage}
                                activeOpacity={0.8}
                                className="mt-3 items-center rounded-2xl border border-[#E2E8F0] bg-white py-4 shadow-sm"
                            >
                                <Text className="text-xs font-bold text-[#64748B]">
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <Toast
                visible={toast.visible}
                type={toast.type}
                message={toast.message}
                onHide={hideToast}
            />
        </SafeAreaView>
    );
};

export default EditAccount;