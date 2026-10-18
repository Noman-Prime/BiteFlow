import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Navbar from "../../../components/Navbar";
import Toast from "../../../components/Toast";

const ReservationScreen = () => {
    const router = useRouter();

    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [toast, setToast] = useState({
        visible: false,
        type: "success",
        message: "",
    });

    const apiUrl = process.env.EXPO_PUBLIC_GET_RESERVATIONS_URL;

    const showToast = useCallback((type, message) => {
        setToast({
            visible: true,
            type,
            message,
        });
    }, []);

    const hideToast = useCallback(() => {
        setToast((prev) => ({
            ...prev,
            visible: false,
        }));
    }, []);

    const fetchReservations = useCallback(async () => {
        try {
            if (!apiUrl) {
                throw new Error(
                    "EXPO_PUBLIC_GET_RESERVATIONS_URL is missing in .env."
                );
            }

            const token = await AsyncStorage.getItem("token");

            if (!token) {
                setReservations([]);
                showToast("error", "Please log in again as a Manager.");
                return;
            }

            const response = await axios.get(apiUrl, {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                timeout: 20000,
            });

            console.log("Reservations API response:", response.data);

            const data = response.data;

            const fetchedReservations = Array.isArray(data)
                ? data
                : Array.isArray(data?.reservations)
                  ? data.reservations
                  : Array.isArray(data?.data?.reservations)
                    ? data.data.reservations
                    : Array.isArray(data?.data)
                      ? data.data
                      : [];

            setReservations(fetchedReservations);
        } catch (error) {
            console.error("Reservations API URL:", apiUrl);
            console.error("Reservations request error:", error.message);
            console.error("HTTP status:", error.response?.status);
            console.error("API error:", error.response?.data);

            const message = error.response
                ? error.response.data?.message ||
                  error.response.data?.error ||
                  `Request failed with status ${error.response.status}.`
                : "Unable to connect. Check the API URL and browser CORS settings.";

            showToast("error", message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [apiUrl, showToast]);

    useEffect(() => {
        fetchReservations();
    }, [fetchReservations]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchReservations();
    };

    const getReservationId = (item) => item._id || item.id;

    const getCustomerName = (item) => {
        const customer = item.user || item.customer;

        if (typeof customer === "string") {
            return item.userName || item.customerName || "Customer";
        }

        return (
            customer?.name ||
            customer?.fullName ||
            item.userName ||
            item.customerName ||
            "Customer"
        );
    };

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case "confirmed":
                return "bg-green-100 text-green-700";
            case "cancelled":
                return "bg-red-100 text-red-700";
            case "pending":
                return "bg-yellow-100 text-yellow-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const renderReservation = ({ item }) => {
        const reservationId = getReservationId(item);
        const status = item.status || "Pending";

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                    if (reservationId) {
                        router.push(`/admin/reservation/${reservationId}`);
                    }
                }}
                className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            >
                <View className="mb-3 flex-row items-center justify-between">
                    <View className="flex-1 flex-row items-center">
                        <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-orange-100">
                            <Ionicons
                                name="calendar-outline"
                                size={22}
                                color="#ea580c"
                            />
                        </View>

                        <View className="flex-1">
                            <Text className="text-base font-bold text-gray-800">
                                {getCustomerName(item)}
                            </Text>

                            <Text className="mt-1 text-xs text-gray-500">
                                Reservation ID:{" "}
                                {reservationId
                                    ? String(reservationId).slice(-8)
                                    : "N/A"}
                            </Text>
                        </View>
                    </View>

                    <View
                        className={`rounded-full px-3 py-1 ${getStatusStyle(status).split(" ")[0]}`}
                    >
                        <Text
                            className={`text-xs font-semibold ${getStatusStyle(status).split(" ")[1]}`}
                        >
                            {status}
                        </Text>
                    </View>
                </View>

                <View className="border-t border-gray-100 pt-3">
                    <View className="mb-3 flex-row items-center">
                        <Ionicons
                            name="restaurant-outline"
                            size={18}
                            color="#6b7280"
                        />
                        <Text className="ml-2 flex-1 text-sm text-gray-600">
                            Table:{" "}
                            {item.table?.tableNumber ||
                                item.table?.number ||
                                item.tableNumber ||
                                item.table ||
                                "N/A"}
                        </Text>

                        <Ionicons
                            name="people-outline"
                            size={18}
                            color="#6b7280"
                        />
                        <Text className="ml-2 text-sm text-gray-600">
                            Guests:{" "}
                            {item.guests ??
                                item.numberOfGuests ??
                                item.numberOfPeople ??
                                item.partySize ??
                                "N/A"}
                        </Text>
                    </View>

                    <View className="mb-3 flex-row items-center">
                        <Ionicons
                            name="calendar-outline"
                            size={18}
                            color="#6b7280"
                        />
                        <Text className="ml-2 flex-1 text-sm text-gray-600">
                            {item.date
                                ? new Date(item.date).toLocaleDateString()
                                : item.reservationDate
                                  ? new Date(
                                        item.reservationDate
                                    ).toLocaleDateString()
                                  : "Date unavailable"}
                        </Text>
                    </View>

                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <Ionicons
                                name="time-outline"
                                size={18}
                                color="#6b7280"
                            />
                            <Text className="ml-2 text-sm text-gray-600">
                                {item.time ||
                                    item.reservationTime ||
                                    "Time unavailable"}
                            </Text>
                        </View>

                        <View className="flex-row items-center">
                            <Text className="mr-1 text-sm font-semibold text-orange-600">
                                View Details
                            </Text>
                            <Ionicons
                                name="chevron-forward"
                                size={16}
                                color="#ea580c"
                            />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar style="dark" />

            <Navbar />

            <View className="flex-1 px-4 pt-5">
                <View className="mb-5 flex-row items-center justify-between">
                    <View>
                        <Text className="text-2xl font-bold text-gray-900">
                            Reservations
                        </Text>
                        <Text className="mt-1 text-sm text-gray-500">
                            Manage customer reservations
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={onRefresh}
                        disabled={loading || refreshing}
                        className="h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white"
                    >
                        <Ionicons
                            name="refresh-outline"
                            size={22}
                            color="#ea580c"
                        />
                    </TouchableOpacity>
                </View>

                <View className="mb-5 rounded-2xl bg-orange-500 p-5">
                    <Text className="text-sm font-medium text-orange-50">
                        Total Reservations
                    </Text>
                    <Text className="mt-1 text-3xl font-bold text-white">
                        {reservations.length}
                    </Text>
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#ea580c" />
                        <Text className="mt-3 text-sm text-gray-500">
                            Loading reservations...
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={reservations}
                        renderItem={renderReservation}
                        keyExtractor={(item, index) =>
                            String(getReservationId(item) || index)
                        }
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={["#ea580c"]}
                            />
                        }
                        contentContainerStyle={{
                            flexGrow: 1,
                            paddingBottom: 24,
                        }}
                        ListEmptyComponent={
                            <View className="flex-1 items-center justify-center py-16">
                                <Ionicons
                                    name="calendar-outline"
                                    size={56}
                                    color="#9ca3af"
                                />
                                <Text className="mt-4 text-lg font-semibold text-gray-700">
                                    No Reservations Found
                                </Text>
                                <Text className="mt-2 text-center text-sm text-gray-500">
                                    Reservations will appear here when available.
                                </Text>

                                <TouchableOpacity
                                    onPress={onRefresh}
                                    className="mt-5 rounded-xl bg-orange-500 px-5 py-3"
                                >
                                    <Text className="font-semibold text-white">
                                        Try Again
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        }
                    />
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

export default ReservationScreen;