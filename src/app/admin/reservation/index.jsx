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
                return "bg-blue-50 text-blue-600 border border-blue-200";
            case "cancelled":
                return "bg-red-50 text-red-600 border border-red-200";
            case "completed":
                return "bg-emerald-50 text-emerald-600 border border-emerald-200";
            case "pending":
            default:
                return "bg-blue-50 text-blue-600 border border-blue-200";
        }
    };

    const renderReservation = ({ item }) => {
        const reservationId = getReservationId(item);
        const status = item.status || "Pending";
        const statusStyleClasses = getStatusStyle(status);
        const [bgClass, textClass, borderClass] = statusStyleClasses.split(" ");

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                    if (reservationId) {
                        router.push(`/admin/reservation/${reservationId}`);
                    }
                }}
                className="mb-3.5 rounded-3xl border border-[#DBEAFE] bg-white p-4 shadow-sm"
            >
                <View className="mb-3 flex-row items-center justify-between">
                    <View className="flex-1 flex-row items-center">
                        <View className="mr-3 h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE]">
                            <Ionicons
                                name="calendar-outline"
                                size={22}
                                color="#2563EB"
                            />
                        </View>

                        <View className="flex-1">
                            <Text className="text-xs font-black text-[#0F172A]">
                                {getCustomerName(item)}
                            </Text>

                            <Text className="mt-0.5 text-[10px] font-medium text-[#64748B]">
                                ID: {reservationId ? String(reservationId).slice(-8) : "N/A"}
                            </Text>
                        </View>
                    </View>

                    <View
                        className={`rounded-xl px-3 py-1 ${bgClass} ${borderClass || ""}`}
                    >
                        <Text
                            className={`text-[10px] font-extrabold uppercase ${textClass}`}
                        >
                            {status}
                        </Text>
                    </View>
                </View>

                <View className="border-t border-[#F1F5F9] pt-3">
                    <View className="mb-2 flex-row items-center">
                        <Ionicons
                            name="restaurant-outline"
                            size={16}
                            color="#64748B"
                        />
                        <Text className="ml-2 flex-1 text-xs font-bold text-[#0F172A]">
                            Table:{" "}
                            <Text className="font-medium text-[#64748B]">
                                {item.table?.tableNumber ||
                                    item.table?.number ||
                                    item.tableNumber ||
                                    item.table ||
                                    "N/A"}
                            </Text>
                        </Text>

                        <Ionicons
                            name="people-outline"
                            size={16}
                            color="#64748B"
                        />
                        <Text className="ml-2 text-xs font-bold text-[#0F172A]">
                            Guests:{" "}
                            <Text className="font-medium text-[#64748B]">
                                {item.guests ??
                                    item.numberOfGuests ??
                                    item.numberOfPeople ??
                                    item.partySize ??
                                    "N/A"}
                            </Text>
                        </Text>
                    </View>

                    <View className="flex-row items-center justify-between pt-1">
                        <View className="flex-row items-center">
                            <Ionicons
                                name="time-outline"
                                size={16}
                                color="#64748B"
                            />
                            <Text className="ml-2 text-[10px] font-medium text-[#64748B]">
                                {item.date
                                    ? new Date(item.date).toLocaleDateString()
                                    : item.reservationDate
                                    ? new Date(item.reservationDate).toLocaleDateString()
                                    : "Date unavailable"}{" "}
                                {" · "}
                                {item.time || item.reservationTime || "Time unavailable"}
                            </Text>
                        </View>

                        <View className="flex-row items-center">
                            <Text className="mr-1 text-xs font-bold text-[#2563EB]">
                                View Details
                            </Text>
                            <Ionicons
                                name="chevron-forward"
                                size={16}
                                color="#2563EB"
                            />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={["top"]}>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />

            <View className="bg-white pb-2 pt-1 border-b border-[#F1F5F9]">
                <Navbar />
            </View>

            <View className="flex-1 px-5 pt-4">
                <View className="mb-4 flex-row items-center justify-between">
                    <View>
                        <Text className="text-xl font-black text-[#0F172A]">
                            Reservations
                        </Text>
                        <Text className="mt-0.5 text-xs text-[#64748B]">
                            Manage customer reservations
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={onRefresh}
                        disabled={loading || refreshing}
                        className="h-11 w-11 items-center justify-center rounded-2xl border border-[#DBEAFE] bg-white shadow-sm"
                    >
                        <Ionicons
                            name="refresh-outline"
                            size={20}
                            color="#2563EB"
                        />
                    </TouchableOpacity>
                </View>

                <View className="mb-4 flex-row items-center rounded-3xl border border-[#DBEAFE] bg-white p-4 shadow-sm">
                    <View className="mr-3 h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE]">
                        <Ionicons name="calendar-outline" size={24} color="#2563EB" />
                    </View>
                    <View>
                        <Text className="text-[10px] font-bold text-[#64748B]">
                            Total Reservations
                        </Text>
                        <Text className="mt-0.5 text-xl font-black text-[#0F172A]">
                            {reservations.length}
                        </Text>
                    </View>
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#2563EB" />
                        <Text className="mt-3 text-xs font-bold text-[#64748B]">
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
                                tintColor="#2563EB"
                                colors={["#2563EB"]}
                            />
                        }
                        contentContainerStyle={{
                            flexGrow: 1,
                            paddingBottom: 24,
                        }}
                        ListEmptyComponent={
                            <View className="flex-1 items-center justify-center rounded-3xl border border-[#DBEAFE] bg-white px-5 py-12 shadow-sm">
                                <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl border border-[#DBEAFE] bg-[#EFF6FF]">
                                    <Ionicons
                                        name="calendar-outline"
                                        size={36}
                                        color="#2563EB"
                                    />
                                </View>
                                <Text className="text-base font-extrabold text-[#0F172A]">
                                    No Reservations Found
                                </Text>
                                <Text className="mt-1 text-center text-xs text-[#64748B]">
                                    Reservations will appear here when available.
                                </Text>

                                <TouchableOpacity
                                    onPress={onRefresh}
                                    className="mt-6 rounded-2xl bg-[#2563EB] px-6 py-3.5 shadow-sm"
                                    activeOpacity={0.8}
                                >
                                    <Text className="text-xs font-bold text-white">
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