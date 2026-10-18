
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import Navbar from "../../../components/Navbar";
import Toast from "../../../components/Toast";

const TableDetails = () => {
    const params = useLocalSearchParams();
    const cleanId = Array.isArray(params.id) ? params.id[0] : params.id;
    const router = useRouter();

    const [table, setTable] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

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
        setToast({ visible: true, type, message });
    };

    const hideToast = () => {
        setToast((prev) => ({ ...prev, visible: false }));
    };

    const fetchApiUrl = process.env.EXPO_PUBLIC_TABLE_VIEW_URL;
    const updateApiUrl = process.env.EXPO_PUBLIC_TABLE_UPDATE_URL;
    const deleteApiUrl = process.env.EXPO_PUBLIC_TABLE_DELETE_URL;

    const getEndpoint = (baseUrl) => {
        if (!baseUrl || !cleanId) return "";

        return `${baseUrl.trim().replace(/\/+$/, "")}/${encodeURIComponent(cleanId)}`;
    };

    const mapTable = (data) => {
        const tableItem = Array.isArray(data) ? data[0] : data;

        if (!tableItem?._id) {
            return false;
        }

        setTable(tableItem);

        setFormData({
            tableNumber: String(tableItem.tableNumber ?? ""),
            seats: String(tableItem.seats ?? ""),
            isAvailable: tableItem.isAvailable !== false,
        });

        return true;
    };

    const fetchTable = useCallback(async () => {
        if (!cleanId || !fetchApiUrl) {
            setTable(null);
            setLoading(false);

            showToast(
                "error",
                !cleanId
                    ? "Table ID is missing."
                    : "Table fetch API URL is missing in .env."
            );

            return false;
        }

        try {
            const token = await AsyncStorage.getItem("token");

            const response = await axios.get(getEndpoint(fetchApiUrl), {
                headers: {
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                withCredentials: true,
            });

            const data =
                response.data?.data ??
                response.data?.table ??
                response.data;

            const mapped = mapTable(data);

            if (!mapped) {
                setTable(null);
                showToast("error", "Table not found.");
            }

            return mapped;
        } catch (error) {
            console.error(
                "Fetch table error:",
                error.response?.data || error.message
            );

            setTable(null);

            showToast(
                "error",
                error.response?.data?.message ||
                    "Unable to load table details."
            );

            return false;
        } finally {
            setLoading(false);
        }
    }, [cleanId, fetchApiUrl]);

    useEffect(() => {
        fetchTable();
    }, [fetchTable]);

    const handleSaveUpdate = async () => {
        if (updating || deleting) return;

        if (
            !formData.tableNumber.trim() ||
            !formData.seats.trim()
        ) {
            showToast("error", "Table number and seats are required.");
            return;
        }

        const tableNum = Number(formData.tableNumber);
        const seatCount = Number(formData.seats);

        if (!Number.isSafeInteger(tableNum) || tableNum <= 0) {
            showToast(
                "error",
                "Please enter a valid positive table number."
            );
            return;
        }

        if (!Number.isSafeInteger(seatCount) || seatCount <= 0) {
            showToast(
                "error",
                "Please enter a valid positive seat count."
            );
            return;
        }

        if (!cleanId || !updateApiUrl) {
            showToast(
                "error",
                "Table update API URL or table ID is missing."
            );
            return;
        }

        setUpdating(true);

        try {
            const token = await AsyncStorage.getItem("token");

            if (!token) {
                showToast("error", "Please log in again.");
                return;
            }

            const response = await axios.put(
                getEndpoint(updateApiUrl),
                {
                    tableNumber: tableNum,
                    seats: seatCount,
                    isAvailable: formData.isAvailable,
                },
                {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    withCredentials: true,
                }
            );

            if (
                response.status !== 200 ||
                response.data?.success !== true
            ) {
                showToast(
                    "error",
                    response.data?.message ||
                        "The server did not confirm the update."
                );
                return;
            }

            const refreshed = await fetchTable();

            if (!refreshed) {
                showToast(
                    "error",
                    "The table was updated, but reloading its details failed."
                );
                return;
            }

            setIsEditing(false);
            showToast("success", "Table updated successfully!");
        } catch (error) {
            console.error("Update table error:", {
                status: error.response?.status,
                response: error.response?.data,
                message: error.message,
            });

            showToast(
                "error",
                error.response?.data?.message ||
                    "Failed to update table."
            );
        } finally {
            setUpdating(false);
        }
    };

    const confirmDelete = async () => {
        if (deleting || updating) return;

        if (!cleanId || !deleteApiUrl) {
            showToast(
                "error",
                "Table delete API URL or table ID is missing."
            );
            return;
        }

        setDeleting(true);

        try {
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
                    response.data?.message || "Failed to delete table."
                );
                return;
            }

            showToast("success", "Table deleted successfully!");

            setTimeout(() => {
                router.replace("/admin/table");
            }, 1500);
        } catch (error) {
            console.error(
                "Delete table error:",
                error.response?.status,
                error.response?.data || error.message
            );

            showToast(
                "error",
                error.response?.data?.message ||
                    `Failed to delete table (${
                        error.response?.status || "network error"
                    }).`
            );
        } finally {
            setDeleting(false);
        }
    };

    const handleDelete = () => {
        if (deleting || updating) return;

        setToast({
            visible: true,
            type: "confirm",
            message: `Are you sure you want to delete Table #${table?.tableNumber}? This action cannot be undone.`,
        });
    };

    const handleConfirmDelete = () => {
        if (deleting || updating) return;

        hideToast();
        confirmDelete();
    };

    const cancelEditing = async () => {
        if (updating || deleting) return;

        setIsEditing(false);

        const restored = await fetchTable();

        if (!restored) {
            showToast(
                "error",
                "Unable to reload the saved table details."
            );
        }
    };

    if (loading) {
        return (
            <SafeAreaView
                className="flex-1 bg-white"
                edges={["top", "left", "right"]}
            >
                <StatusBar style="dark" backgroundColor="#FFFFFF" />

                <Navbar />

                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#F97316" />

                    <Text className="mt-3 text-sm text-gray-500">
                        Loading table details...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!table) {
        return (
            <SafeAreaView
                className="flex-1 bg-white"
                edges={["top", "left", "right"]}
            >
                <StatusBar style="dark" backgroundColor="#FFFFFF" />

                <Navbar />

                <View className="flex-1 items-center justify-center px-6">
                    <Ionicons
                        name="alert-circle-outline"
                        size={48}
                        color="#EF4444"
                    />

                    <Text className="mt-3 text-lg font-bold text-gray-900">
                        Table Not Found
                    </Text>

                    <Text className="mt-2 text-center text-sm text-gray-500">
                        The table could not be loaded. Check the table ID
                        and API configuration.
                    </Text>

                    <TouchableOpacity
                        onPress={() => {
                            if (router.canGoBack()) {
                                router.back();
                            } else {
                                router.replace("/admin/table");
                            }
                        }}
                        className="mt-5 rounded-xl bg-gray-900 px-6 py-3"
                    >
                        <Text className="font-bold text-white">
                            Go Back
                        </Text>
                    </TouchableOpacity>
                </View>

                <Toast
                    visible={toast.visible}
                    type={toast.type}
                    message={toast.message}
                    onHide={hideToast}
                    onConfirm={handleConfirmDelete}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            className="flex-1 bg-white"
            edges={["top", "left", "right"]}
        >
            <StatusBar style="dark" backgroundColor="#FFFFFF" />

            <Navbar />

            <KeyboardAwareScrollView
                className="flex-1 bg-white"
                contentContainerStyle={{
                    padding: 20,
                    paddingBottom: 140,
                }}
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
                    <Ionicons
                        name="arrow-back"
                        size={18}
                        color="#111827"
                    />

                    <Text className="ml-2 text-xs font-bold text-gray-900">
                        Back to Management
                    </Text>
                </TouchableOpacity>

                {!isEditing ? (
                    <View className="h-64 w-full items-center justify-center rounded-2xl border border-gray-200 bg-orange-50">
                        <Ionicons
                            name="restaurant-outline"
                            size={72}
                            color="#F97316"
                        />

                        <Text className="mt-3 text-sm font-bold text-orange-600">
                            Restaurant Table
                        </Text>

                        <Text className="mt-1 text-xs text-gray-500">
                            Table #{table.tableNumber}
                        </Text>
                    </View>
                ) : (
                    <View className="mb-4 h-44 w-full items-center justify-center rounded-2xl border border-gray-200 bg-orange-50">
                        <Ionicons
                            name="restaurant-outline"
                            size={56}
                            color="#F97316"
                        />

                        <Text className="mt-2 text-xs font-bold text-orange-600">
                            Editing Table #{table.tableNumber}
                        </Text>
                    </View>
                )}

                {!isEditing ? (
                    <View className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
                        <View className="flex-row items-start justify-between">
                            <Text className="mr-2 flex-1 text-2xl font-extrabold text-gray-900">
                                Table #{table.tableNumber}
                            </Text>

                            <Text className="text-xl font-extrabold text-orange-500">
                                {table.seats}{" "}
                                {Number(table.seats) === 1
                                    ? "Seat"
                                    : "Seats"}
                            </Text>
                        </View>

                        <View className="mt-4 flex-row items-center">
                            <View className="mr-2 rounded-lg border border-gray-200 bg-gray-100 px-3 py-1.5">
                                <Text className="text-xs font-bold text-gray-800">
                                    Table {table.tableNumber}
                                </Text>
                            </View>

                            <View
                                className={`rounded-lg border px-3 py-1.5 ${
                                    table.isAvailable !== false
                                        ? "border-emerald-200 bg-emerald-50"
                                        : "border-red-200 bg-red-50"
                                }`}
                            >
                                <Text
                                    className={`text-xs font-bold ${
                                        table.isAvailable !== false
                                            ? "text-emerald-600"
                                            : "text-red-600"
                                    }`}
                                >
                                    {table.isAvailable !== false
                                        ? "Available"
                                        : "Unavailable"}
                                </Text>
                            </View>
                        </View>

                        <View className="mt-6 border-t border-gray-100 pt-4">
                            <Text className="text-sm font-bold text-gray-800">
                                Table Information
                            </Text>

                            <View className="mt-3 flex-row items-center justify-between border-b border-gray-100 py-3">
                                <Text className="text-sm text-gray-500">
                                    Table Number
                                </Text>

                                <Text className="text-sm font-bold text-gray-900">
                                    {table.tableNumber}
                                </Text>
                            </View>

                            <View className="flex-row items-center justify-between border-b border-gray-100 py-3">
                                <Text className="text-sm text-gray-500">
                                    Seating Capacity
                                </Text>

                                <Text className="text-sm font-bold text-gray-900">
                                    {table.seats}{" "}
                                    {Number(table.seats) === 1
                                        ? "Person"
                                        : "Persons"}
                                </Text>
                            </View>

                            <View className="flex-row items-center justify-between py-3">
                                <Text className="text-sm text-gray-500">
                                    Availability
                                </Text>

                                <Text
                                    className={`text-sm font-bold ${
                                        table.isAvailable !== false
                                            ? "text-emerald-600"
                                            : "text-red-600"
                                    }`}
                                >
                                    {table.isAvailable !== false
                                        ? "Available"
                                        : "Unavailable"}
                                </Text>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View className="mt-2 rounded-2xl border border-orange-200 bg-white p-5">
                        <Text className="mb-4 text-lg font-extrabold text-gray-900">
                            Edit Table Details
                        </Text>

                        <Text className="mb-1 text-xs font-bold text-gray-700">
                            Table Number
                        </Text>

                        <TextInput
                            value={formData.tableNumber}
                            onChangeText={(value) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    tableNumber: value,
                                }))
                            }
                            keyboardType="number-pad"
                            editable={!updating && !deleting}
                            className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm text-gray-900"
                            placeholder="Enter table number"
                            placeholderTextColor="#9CA3AF"
                        />

                        <Text className="mb-1 text-xs font-bold text-gray-700">
                            Seat Capacity
                        </Text>

                        <TextInput
                            value={formData.seats}
                            onChangeText={(value) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    seats: value,
                                }))
                            }
                            keyboardType="number-pad"
                            editable={!updating && !deleting}
                            className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm text-gray-900"
                            placeholder="Enter number of seats"
                            placeholderTextColor="#9CA3AF"
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
                            disabled={updating || deleting}
                            className={`mb-4 flex-row items-center justify-between rounded-xl border p-3 ${
                                formData.isAvailable
                                    ? "border-emerald-200 bg-emerald-50"
                                    : "border-red-200 bg-red-50"
                            }`}
                        >
                            <Text
                                className={`text-xs font-bold ${
                                    formData.isAvailable
                                        ? "text-emerald-700"
                                        : "text-red-700"
                                }`}
                            >
                                {formData.isAvailable
                                    ? "Available to Customers"
                                    : "Unavailable"}
                            </Text>

                            <Ionicons
                                name={
                                    formData.isAvailable
                                        ? "checkmark-circle"
                                        : "close-circle"
                                }
                                size={22}
                                color={
                                    formData.isAvailable
                                        ? "#059669"
                                        : "#DC2626"
                                }
                            />
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAwareScrollView>

            <View className="flex-row items-center justify-between border-t border-gray-200 bg-white px-5 py-4">
                {!isEditing ? (
                    <>
                        <TouchableOpacity
                            onPress={() => setIsEditing(true)}
                            disabled={deleting || updating}
                            className="mr-2.5 flex-1 flex-row items-center justify-center rounded-xl bg-orange-500 py-3.5"
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name="create-outline"
                                size={18}
                                color="#FFFFFF"
                            />

                            <Text className="ml-2 font-bold text-white">
                                Update Table
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleDelete}
                            disabled={deleting || updating}
                            className="ml-2.5 flex-1 flex-row items-center justify-center rounded-xl bg-red-600 py-3.5"
                            activeOpacity={0.8}
                        >
                            {deleting ? (
                                <ActivityIndicator
                                    size="small"
                                    color="#FFFFFF"
                                />
                            ) : (
                                <>
                                    <Ionicons
                                        name="trash-outline"
                                        size={18}
                                        color="#FFFFFF"
                                    />

                                    <Text className="ml-2 font-bold text-white">
                                        Delete Table
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TouchableOpacity
                            onPress={handleSaveUpdate}
                            disabled={updating || deleting}
                            className="mr-2.5 flex-1 flex-row items-center justify-center rounded-xl bg-emerald-600 py-3.5"
                            activeOpacity={0.8}
                        >
                            {updating ? (
                                <ActivityIndicator
                                    size="small"
                                    color="#FFFFFF"
                                />
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
                            disabled={updating || deleting}
                            className="ml-2.5 flex-1 items-center justify-center rounded-xl bg-gray-200 py-3.5"
                            activeOpacity={0.8}
                        >
                            <Text className="font-bold text-gray-700">
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            <Toast
                visible={toast.visible}
                type={toast.type}
                message={toast.message}
                onHide={hideToast}
                onConfirm={handleConfirmDelete}
            />
        </SafeAreaView>
    );
};

TableDetails.displayName = "TableDetails";

export default TableDetails;