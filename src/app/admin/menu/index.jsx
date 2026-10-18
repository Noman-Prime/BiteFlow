import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Navbar from "../../../components/Navbar";
import Toast from "../../../components/Toast";

const MenuManagement = () => {
  const router = useRouter();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  // Get API URL from environment variables
  const apiUrl =
    process.env.EXPO_PUBLIC_GET_MENU_URL ||
    process.env.EXPO_PUBLIC_MENU_URL;

  const fetchMenuItems = useCallback(async () => {
    if (!apiUrl) {
      showToast("error", "EXPO_PUBLIC_GET_MENU_URL is missing in .env file.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const response = await axios.get(apiUrl, {
        headers: { Accept: "application/json" },
        withCredentials: true,
      });

      let fetchedItems = [];

      if (Array.isArray(response.data)) {
        fetchedItems = response.data;
      } else if (Array.isArray(response.data?.data)) {
        fetchedItems = response.data.data;
      } else if (Array.isArray(response.data?.menu)) {
        fetchedItems = response.data.menu;
      } else if (Array.isArray(response.data?.items)) {
        fetchedItems = response.data.items;
      } else if (response.data && typeof response.data === "object") {
        const possibleArray = Object.values(response.data).find((val) =>
          Array.isArray(val)
        );
        if (possibleArray) fetchedItems = possibleArray;
      }

      setMenuItems(fetchedItems);
    } catch (err) {
      console.error("Error fetching menu items:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to load menu items.";
      showToast("error", errorMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiUrl]);

  // Use useFocusEffect so the list automatically re-fetches when navigating back
  useFocusEffect(
    useCallback(() => {
      fetchMenuItems();
    }, [fetchMenuItems])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMenuItems();
  };

  const renderMenuItem = ({ item }) => {
    const imageUrl = item.image?.url || (typeof item.image === "string" ? item.image : null);
    const itemId = item._id || item.id;

    return (
      <TouchableOpacity
        onPress={() => {
          if (itemId) {
            router.push(`/admin/menu/${itemId}`);
          } else {
            showToast("error", "Invalid item ID.");
          }
        }}
        activeOpacity={0.8}
        className="mb-4 flex-row overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 shadow-md"
      >
        {/* Item Image */}
        <View className="h-24 w-24 overflow-hidden rounded-xl bg-gray-100">
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : (
            <View className="h-full w-full items-center justify-center bg-gray-200">
              <Ionicons name="fast-food-outline" size={32} color="#9CA3AF" />
            </View>
          )}
        </View>

        {/* Item Details */}
        <View className="ml-3 flex-1 justify-between py-0.5">
          <View>
            <View className="flex-row items-center justify-between">
              <Text
                className="flex-1 text-base font-bold text-gray-900"
                numberOfLines={1}
              >
                {item.name || item.title || "Unnamed Item"}
              </Text>
              <Text className="ml-2 text-lg font-extrabold text-orange-500">
                Rs. {item.price ?? 0}
              </Text>
            </View>

            <Text
              className="mt-1 text-xs text-gray-500"
              numberOfLines={2}
            >
              {item.description || "No description available."}
            </Text>
          </View>

          {/* Badges: Category & Availability */}
          <View className="mt-2 flex-row items-center justify-between">
            <View className="rounded-lg bg-gray-100 px-2.5 py-1">
              <Text className="text-xs font-semibold text-gray-700">
                {item.category || "General"}
              </Text>
            </View>

            <View
              className={`rounded-lg px-2.5 py-1 ${
                item.isAvailable !== false
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  item.isAvailable !== false
                    ? "text-emerald-700"
                    : "text-red-700"
                }`}
              >
                {item.isAvailable !== false ? "Available" : "Unavailable"}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <View className="h-px w-full bg-white" />

      {/* Global Toast Popup */}
      <Toast
        visible={toast.visible}
        type={toast.type}
        message={toast.message}
        onHide={hideToast}
      />

      <View className="flex-1 bg-white">
        <Navbar />

        <View className="flex-1 px-5 pt-5">
          {/* Header & Create Button Section */}
          <View className="mb-5 flex-row items-center justify-between">
            <View className="flex-1 pr-2">
              <Text className="text-2xl font-extrabold text-gray-900">
                Menu <Text className="text-orange-500">Management</Text>
              </Text>
              <Text className="mt-0.5 text-xs text-gray-500">
                {menuItems.length} {menuItems.length === 1 ? "Item" : "Items"} available
              </Text>
            </View>

            {/* Create Menu Item Button */}
            <TouchableOpacity
              className="flex-row items-center rounded-xl bg-orange-500 px-4 py-3 shadow-lg"
              onPress={() => router.push("/admin/menu/add")}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text className="ml-1.5 text-sm font-bold text-white">
                Create Item
              </Text>
            </TouchableOpacity>
          </View>

          {/* Main Content View */}
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#F97316" />
              <Text className="mt-3 text-sm font-medium text-gray-500">
                Loading menu items...
              </Text>
            </View>
          ) : menuItems.length === 0 ? (
            /* Empty State Container */
            <View className="flex-1 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 px-5 py-12 mb-6">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/20">
                <Ionicons name="restaurant-outline" size={32} color="#F97316" />
              </View>

              <Text className="mb-1 text-lg font-bold text-gray-900">
                No Menu Items Found
              </Text>

              <Text className="mb-6 text-center text-xs leading-5 text-gray-500">
                Start by creating food items to build your restaurant menu.
              </Text>

              <TouchableOpacity
                className="w-full flex-row items-center justify-center rounded-xl bg-orange-500 px-5 py-3.5"
                onPress={() => router.push("/admin/menu/add")}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                <Text className="ml-2 text-sm font-bold text-white">
                  Add First Menu Item
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Menu Items List */
            <FlatList
              data={menuItems}
              keyExtractor={(item, index) =>
                item._id ? item._id.toString() : index.toString()
              }
              renderItem={renderMenuItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#F97316"
                  colors={["#F97316"]}
                />
              }
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default MenuManagement;