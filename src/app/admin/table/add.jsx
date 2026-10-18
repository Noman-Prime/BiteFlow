import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import Navbar from "../../../components/Navbar";
import Toast from "../../../components/Toast";

const AddTable = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        tableNumber: "",
        seats: "",
        isAvailable: true,
    });

    const [toast, setToast] = useState({
        visible: false,
        type: "success",
        message: "",
    });

    const showToast = (type, message) => {
        setToast({
            visible: true,
            type,
            message
        });
    };

    const hideToast = () => {
        setToast((prev) => ({ ...prev, visible: false }));
    };

    const apiUrl = process.env.EXPO_PUBLIC_TABLE_CREATE_URL;

    const handleCreateTable = async () => {
        if (!formData.tableNumber.trim() || !formData.seats.trim()) {
            showToast("error", "Table number and seats are required.");
            return;
        }

        const tableNum = Number(formData.tableNumber);
        const seatCount = Number(formData.seats);

        if (!Number.isFinite(tableNum) || tableNum <= 0) {
            showToast("error", "Please enter a valid table number.");
            return;
        }

        if (!Number.isFinite(seatCount) || seatCount <= 0) {
            showToast("error", "Please enter a valid seat count.");
            return;
        }

        if (!apiUrl) {
            showToast("error", "EXPO_PUBLIC_TABLE_CREATE_URL is missing in .env file.");
            return;
        }

        setLoading(true);

        try {
            const token = await AsyncStorage.getItem("token");

            if (!token) {
                showToast("error", "Please log in again.");
                setLoading(false);
                return;
            }

            const payload = {
                tableNumber: tableNum,
                seats: seatCount,
                isAvailable: formData.isAvailable,
            };

            const response = await axios.post(apiUrl, payload, {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                withCredentials: true,
            });

            if (response.status >= 200 && response.status < 300) {
                showToast("success", "Table created successfully!");

                // Clear input data
                setFormData({
                    tableNumber: "",
                    seats: "",
                    isAvailable: true,
                });

                // Go back to index.jsx (which triggers useFocusEffect to recall the API automatically)
                setTimeout(() => {
                    router.back();
                }, 800);
            } else {
                showToast("error", response.data?.message || "Failed to create table.");
            }
        } catch (error) {
            console.error("Create table error:", error.response?.data || error.message);
            showToast(
                "error",
                error.response?.data?.message || "Failed to create table."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />

            {/* Navbar Header */}
            <Navbar />

            {/* Toast Component positioned right below the navbar area */}
            <Toast
                visible={toast.visible}
                type={toast.type}
                message={toast.message}
                onHide={hideToast}
            />

            <KeyboardAwareScrollView
                className="flex-1 bg-white"
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                enableOnAndroid
                showsVerticalScrollIndicator={false}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="mb-5 flex-row items-center self-start rounded-xl border border-gray-100 bg-white px-4 py-2.5 shadow-sm"
                >
                    <Ionicons name="arrow-back" size={18} color="#111827" />
                    <Text className="ml-2 text-xs font-bold text-gray-900">
                        Back to Tables
                    </Text>
                </TouchableOpacity>

                <View className="mb-6">
                    <Text className="text-2xl font-extrabold text-gray-900">
                        Create New <Text className="text-orange-500">Table</Text>
                    </Text>
                    <Text className="mt-1 text-xs text-gray-500">
                        Add seating arrangements for your restaurant layout.
                    </Text>
                </View>

                {/* Form Fields Container */}
                <View className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <Text className="mb-1 text-xs font-bold text-gray-700">
                        Table Number
                    </Text>
                    <TextInput
                        value={formData.tableNumber}
                        onChangeText={(val) =>
                            setFormData((prev) => ({ ...prev, tableNumber: val }))
                        }
                        keyboardType="number-pad"
                        className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm text-gray-900"
                        placeholder="e.g. 1, 2, 3"
                        placeholderTextColor="#9CA3AF"
                    />

                    <Text className="mb-1 text-xs font-bold text-gray-700">
                        Seat Capacity
                    </Text>
                    <TextInput
                        value={formData.seats}
                        onChangeText={(val) =>
                            setFormData((prev) => ({ ...prev, seats: val }))
                        }
                        keyboardType="number-pad"
                        className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm text-gray-900"
                        placeholder="e.g. 4 persons"
                        placeholderTextColor="#9CA3AF"
                    />

                    <Text className="mb-1 text-xs font-bold text-gray-700">
                        Initial Status
                    </Text>
                    <TouchableOpacity
                        onPress={() =>
                            setFormData((prev) => ({
                                ...prev,
                                isAvailable: !prev.isAvailable,
                            }))
                        }
                        className={`mb-2 flex-row items-center justify-between rounded-xl border p-3 ${
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
                            {formData.isAvailable ? "Active (Available)" : "Inactive"}
                        </Text>
                        <Ionicons
                            name={formData.isAvailable ? "checkmark-circle" : "close-circle"}
                            size={20}
                            color={formData.isAvailable ? "#059669" : "#DC2626"}
                        />
                    </TouchableOpacity>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    onPress={handleCreateTable}
                    disabled={loading}
                    className="mt-6 flex-row items-center justify-center rounded-xl bg-orange-500 py-4 shadow-md active:bg-orange-600"
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <>
                            <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                            <Text className="ml-2 font-bold text-white">Save Table</Text>
                        </>
                    )}
                </TouchableOpacity>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
};

export default AddTable;