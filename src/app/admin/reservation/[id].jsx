import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Navbar from "../../../components/Navbar";
import Toast from "../../../components/Toast";

const ReservationDetails = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const reservationId = Array.isArray(id) ? id[0] : id;

    const [reservation, setReservation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [toast, setToast] = useState({
        visible: false,
        type: "success",
        message: "",
    });

    const showToast = useCallback((type, message) => {
        setToast({
            visible: true,
            type,
            message,
        });
    }, []);

    const hideToast = useCallback(() => {
        setToast((previous) => ({
            ...previous,
            visible: false,
        }));
    }, []);

    const getReservation = useCallback(async () => {
        try {
            setLoading(true);

            const token = await AsyncStorage.getItem("token");

            if (!token) {
                showToast("error", "Please log in again to continue.");
                return;
            }

            const baseUrl =
                process.env.EXPO_PUBLIC_GET_RESERVATION_BY_ID_URL;

            if (!baseUrl || !reservationId) {
                throw new Error("Reservation URL or ID is missing.");
            }

            const response = await axios.get(
                `${baseUrl}/${reservationId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                    timeout: 20000,
                }
            );

            const data = response.data?.reservation;

            if (!data) {
                throw new Error("Reservation details were not found.");
            }

            setReservation(data);
        } catch (error) {
            console.error(
                "Error fetching reservation:",
                error.response?.data || error.message
            );

            showToast(
                "error",
                error.response?.data?.message ||
                    error.message ||
                    "Failed to fetch reservation details."
            );
        } finally {
            setLoading(false);
        }
    }, [reservationId, showToast]);

    useEffect(() => {
        if (reservationId) {
            getReservation();
        } else {
            setLoading(false);
            showToast("error", "Reservation ID is missing.");
        }
    }, [reservationId, getReservation, showToast]);

    const updateStatus = async (newStatus) => {
        if (updating) return;

        try {
            setUpdating(true);

            const token = await AsyncStorage.getItem("token");

            if (!token) {
                showToast("error", "Please log in again.");
                return;
            }

            const baseUrl =
                process.env.EXPO_PUBLIC_UPDATE_RESERVATION_STATUS_URL;

            if (!baseUrl || !reservationId) {
                throw new Error("Reservation update URL or ID is missing.");
            }

            const response = await axios.put(
                `${baseUrl}/${reservationId}`,
                { status: newStatus },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                    timeout: 20000,
                }
            );

            setReservation((previous) => ({
                ...previous,
                ...(response.data?.reservation || {}),
                status:
                    response.data?.reservation?.status || newStatus,
            }));

            showToast(
                "success",
                response.data?.message ||
                    `Reservation ${newStatus.toLowerCase()} successfully.`
            );
        } catch (error) {
            console.error(
                "Error updating reservation:",
                error.response?.data || error.message
            );

            showToast(
                "error",
                error.response?.data?.message ||
                    "Failed to update reservation status."
            );
        } finally {
            setUpdating(false);
        }
    };

    const confirmStatusUpdate = (newStatus) => {
        const message =
            newStatus === "Confirmed"
                ? "Confirm this reservation?"
                : "Cancel this reservation?";

        if (Platform.OS === "web") {
            if (typeof window !== "undefined" && window.confirm(message)) {
                updateStatus(newStatus);
            }

            return;
        }

        // Use a toast for feedback; on native, update directly.
        // Confirmation can be added through a dedicated modal if required.
        updateStatus(newStatus);
    };

    const formatDate = (date) => {
        if (!date) return "Not provided";

        const parsedDate = new Date(date);

        return Number.isNaN(parsedDate.getTime())
            ? String(date)
            : parsedDate.toLocaleDateString();
    };

    const getTableName = () => {
        if (!reservation?.table) return "Not assigned";

        if (typeof reservation.table === "string") {
            return reservation.table;
        }

        return (
            reservation.table.tableNumber ||
            reservation.table.number ||
            reservation.table.name ||
            reservation.table._id ||
            "Assigned"
        );
    };

    const DetailRow = ({ icon, label, value }) => (
        <View className="flex-row items-center border-b border-gray-100 py-3">
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                <Ionicons name={icon} size={21} color="#EA580C" />
            </View>

            <View className="flex-1">
                <Text className="mb-1 text-xs text-gray-400">{label}</Text>
                <Text className="text-sm font-semibold text-gray-800">
                    {value === null || value === undefined || value === ""
                        ? "Not provided"
                        : String(value)}
                </Text>
            </View>
        </View>
    );

    const status = reservation?.status || "Pending";
    const normalizedStatus = status.toLowerCase();
    const isConfirmed = normalizedStatus === "confirmed";
    const isCancelled = normalizedStatus === "cancelled";
    const isCompleted = normalizedStatus === "completed";

    const statusClass =
        normalizedStatus === "confirmed"
            ? "bg-green-100 text-green-700"
            : normalizedStatus === "cancelled"
              ? "bg-red-100 text-red-700"
              : normalizedStatus === "completed"
                ? "bg-blue-100 text-blue-700"
                : "bg-amber-100 text-amber-700";

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar style="dark" />

            <Navbar />

            <View className="flex-row items-center border-b border-gray-200 bg-white px-4 py-4">
                <TouchableOpacity
                    className="h-11 w-11 items-center justify-center rounded-xl bg-gray-100"
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={23} color="#1F2937" />
                </TouchableOpacity>

                <View className="ml-3 flex-1">
                    <Text className="text-xl font-bold text-gray-900">
                        Reservation Details
                    </Text>
                    <Text className="mt-1 text-xs text-gray-500">
                        Manage this reservation
                    </Text>
                </View>

                <TouchableOpacity
                    className="h-11 w-11 items-center justify-center rounded-xl bg-gray-100"
                    onPress={getReservation}
                    disabled={loading || updating}
                >
                    <Ionicons
                        name="refresh-outline"
                        size={22}
                        color="#1F2937"
                    />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center px-6">
                    <ActivityIndicator size="large" color="#EA580C" />
                    <Text className="mt-4 text-sm text-gray-500">
                        Loading reservation details...
                    </Text>
                </View>
            ) : !reservation ? (
                <View className="flex-1 items-center justify-center px-6">
                    <Ionicons
                        name="alert-circle-outline"
                        size={54}
                        color="#DC2626"
                    />

                    <Text className="mt-4 text-center text-xl font-bold text-gray-900">
                        Unable to Load Reservation
                    </Text>

                    <Text className="mt-2 text-center text-sm leading-6 text-gray-500">
                        Check the error message and try again.
                    </Text>

                    <TouchableOpacity
                        className="mt-6 rounded-xl bg-orange-600 px-7 py-3"
                        onPress={getReservation}
                    >
                        <Text className="font-semibold text-white">
                            Try Again
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="mt-3 p-3"
                        onPress={() => router.back()}
                    >
                        <Text className="font-semibold text-gray-700">
                            Go Back
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{
                        padding: 18,
                        paddingBottom: 40,
                        width: "100%",
                        maxWidth: 850,
                        alignSelf: "center",
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    <View className="rounded-2xl border border-gray-200 bg-white p-5">
                        <View className="flex-row items-start justify-between gap-3">
                            <View className="flex-1">
                                <Text className="text-[11px] font-bold tracking-widest text-gray-400">
                                    RESERVATION ID
                                </Text>

                                <Text className="mt-2 text-xs font-semibold text-gray-700">
                                    {reservation._id || reservationId}
                                </Text>
                            </View>

                            <View
                                className={`rounded-full px-3 py-2 ${statusClass.split(" ")[0]}`}
                            >
                                <Text
                                    className={`text-xs font-bold ${statusClass.split(" ")[1]}`}
                                >
                                    {status}
                                </Text>
                            </View>
                        </View>

                        <View className="my-5 h-px bg-gray-200" />

                        <DetailRow
                            icon="person-outline"
                            label="Customer"
                            value={
                                reservation.user?.name ||
                                reservation.user?.email
                            }
                        />

                        <DetailRow
                            icon="mail-outline"
                            label="Email"
                            value={reservation.user?.email}
                        />

                        <DetailRow
                            icon="calendar-outline"
                            label="Reservation Date"
                            value={formatDate(reservation.date)}
                        />

                        <DetailRow
                            icon="time-outline"
                            label="Start Time"
                            value={reservation.startTime}
                        />

                        <DetailRow
                            icon="time-outline"
                            label="End Time"
                            value={reservation.endTime}
                        />

                        <DetailRow
                            icon="restaurant-outline"
                            label="Table"
                            value={getTableName()}
                        />

                        <DetailRow
                            icon="people-outline"
                            label="Guests"
                            value={
                                reservation.numberOfGuests ??
                                reservation.guests ??
                                reservation.numberOfPeople ??
                                reservation.people
                            }
                        />

                        <DetailRow
                            icon="calendar-clear-outline"
                            label="Created At"
                            value={formatDate(reservation.createdAt)}
                        />
                    </View>

                    <View className="mt-5 rounded-2xl border border-gray-200 bg-white p-5">
                        <Text className="text-lg font-bold text-gray-900">
                            Manage Reservation
                        </Text>

                        <Text className="mb-5 mt-2 text-sm leading-6 text-gray-500">
                            Update the status of this reservation using the actions below.
                        </Text>

                        {isCancelled || isCompleted ? (
                            <View className="flex-row items-center rounded-xl bg-gray-50 p-4">
                                <Ionicons
                                    name={
                                        isCancelled
                                            ? "close-circle"
                                            : "checkmark-circle"
                                    }
                                    size={23}
                                    color={isCancelled ? "#DC2626" : "#16A34A"}
                                />

                                <Text className="ml-3 flex-1 text-sm font-semibold text-gray-700">
                                    {isCancelled
                                        ? "This reservation has been cancelled."
                                        : "This reservation is completed."}
                                </Text>
                            </View>
                        ) : (
                            <>
                                {!isConfirmed && (
                                    <TouchableOpacity
                                        className={`min-h-12 flex-row items-center justify-center rounded-xl bg-green-600 px-4 py-4 ${
                                            updating ? "opacity-60" : ""
                                        }`}
                                        onPress={() =>
                                            confirmStatusUpdate("Confirmed")
                                        }
                                        disabled={updating}
                                    >
                                        {updating ? (
                                            <ActivityIndicator color="#FFFFFF" />
                                        ) : (
                                            <>
                                                <Ionicons
                                                    name="checkmark-circle-outline"
                                                    size={21}
                                                    color="#FFFFFF"
                                                />
                                                <Text className="ml-2 font-bold text-white">
                                                    Confirm Reservation
                                                </Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    className={`mt-3 min-h-12 flex-row items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-4 ${
                                        updating ? "opacity-60" : ""
                                    }`}
                                    onPress={() =>
                                        confirmStatusUpdate("Cancelled")
                                    }
                                    disabled={updating}
                                >
                                    <Ionicons
                                        name="close-circle-outline"
                                        size={21}
                                        color="#DC2626"
                                    />
                                    <Text className="ml-2 font-bold text-red-600">
                                        Cancel Reservation
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </ScrollView>
            )}

            <Toast
                visible={toast.visible}
                type={toast.type}
                message={toast.message}
                onHide={hideToast}
            />
        </SafeAreaView>
    );
};

export default ReservationDetails;
