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

    // Fields corresponding to the Mongoose schema
    formData.append("name", name.trim());
    formData.append("description", description.trim());
    formData.append("price", String(numericPrice));
    formData.append("category", category);
    formData.append("isAvailable", String(isAvailable));

    // The backend's upload.single("image") expects this exact field name.
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

      // 1. Show success message immediately
      showToast(
        "success",
        response.data?.message || "Menu item created successfully."
      );

      // 2. Clear out the form fields instantly
      setName("");
      setDescription("");
      setPrice("");
      setCategory("Mains");
      setImage(null);
      setIsAvailable(true);
      setLoading(false);

      // 3. Wait 1.5 seconds so the user can read the success toast before returning to the index page
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
      <Text className="mb-2 text-sm font-bold text-gray-200">
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#6B7280"
        multiline={multiline}
        keyboardType={keyboardType}
        editable={!loading}
        className={`w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3.5 text-base text-white ${
          multiline ? "min-h-28" : "h-14"
        }`}
        style={multiline ? { textAlignVertical: "top" } : undefined}
      />
    </View>
  );

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      edges={["top", "left", "right"]}
    >
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <View className="h-px w-full bg-white" />

      <View className="flex-1 bg-[#111827]">
        <Navbar />

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
                className="mb-6 flex-row items-center self-start"
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={22} color="#F97316" />
                <Text className="ml-2 font-semibold text-orange-500">
                  Back to Menu
                </Text>
              </TouchableOpacity>

              <View className="mb-7">
                <Text className="text-3xl font-extrabold text-white">
                  Add <Text className="text-orange-500">Menu Item</Text>
                </Text>
                <Text className="mt-2 text-base leading-6 text-gray-400">
                  Add food information and select an image.
                </Text>
              </View>

              <View className="rounded-2xl border border-gray-700 bg-gray-800 p-5 shadow-lg">
                <View className="mb-6 flex-row items-center">
                  <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30">
                    <Ionicons
                      name="restaurant-outline"
                      size={26}
                      color="#F97316"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-white">
                      Food Details
                    </Text>
                    <Text className="mt-1 text-sm text-gray-400">
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
                  <Text className="mb-2 text-sm font-bold text-gray-200">
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
                          className={`rounded-full border px-4 py-2.5 ${
                            selected
                              ? "border-orange-500 bg-orange-500/20"
                              : "border-gray-700 bg-gray-900"
                          }`}
                          activeOpacity={0.75}
                        >
                          <Text
                            className={`text-sm font-semibold ${
                              selected
                                ? "text-orange-400"
                                : "text-gray-300"
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
                  <Text className="mb-2 text-sm font-bold text-gray-200">
                    Food Image *
                  </Text>

                  {image ? (
                    <View>
                      <Image
                        source={{ uri: image.uri }}
                        className="h-56 w-full rounded-xl bg-gray-900"
                        resizeMode="cover"
                      />

                      <TouchableOpacity
                        onPress={pickImage}
                        disabled={loading}
                        className="mt-3 flex-row items-center justify-center rounded-xl border border-gray-700 bg-gray-900 px-4 py-3"
                        activeOpacity={0.75}
                      >
                        <Ionicons
                          name="image-outline"
                          size={20}
                          color="#F97316"
                        />
                        <Text className="ml-2 font-semibold text-gray-200">
                          Change Image
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={pickImage}
                      disabled={loading}
                      className="items-center justify-center rounded-xl border-2 border-dashed border-gray-700 bg-gray-900 px-4 py-8"
                      activeOpacity={0.75}
                    >
                      <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-orange-500/15 border border-orange-500/30">
                        <Ionicons
                          name="cloud-upload-outline"
                          size={28}
                          color="#F97316"
                        />
                      </View>
                      <Text className="font-bold text-white">
                        Select Food Image
                      </Text>
                      <Text className="mt-2 text-center text-sm text-gray-400">
                        Choose a photo from your device
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View className="mb-6 flex-row items-center justify-between rounded-xl border border-gray-700 bg-gray-900 p-4">
                  <View className="flex-1 pr-3">
                    <Text className="text-base font-bold text-white">
                      Available for ordering
                    </Text>
                    <Text className="mt-1 text-sm text-gray-400">
                      Allow customers to order this item.
                    </Text>
                  </View>
                  <Switch
                    value={isAvailable}
                    onValueChange={setIsAvailable}
                    disabled={loading}
                    trackColor={{
                      false: "#374151",
                      true: "#F97316",
                    }}
                    thumbColor={isAvailable ? "#FFFFFF" : "#9CA3AF"}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleCreateMenu}
                  disabled={loading}
                  className={`flex-row items-center justify-center rounded-xl px-5 py-4 ${
                    loading ? "bg-orange-400" : "bg-orange-500"
                  }`}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Ionicons
                      name="add-circle-outline"
                      size={22}
                      color="#FFFFFF"
                    />
                  )}
                  <Text className="ml-2 text-base font-bold text-white">
                    {loading ? "Creating Menu..." : "Create Menu"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

export default AddMenu;