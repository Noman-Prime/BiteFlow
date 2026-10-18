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
        <View className="flex-row items-center border-b border-[#F1F5F9] py-3">
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE]">
                <Ionicons name={icon} size={20} color="#2563EB" />
            </View>

            <View className="flex-1">
                <Text className="mb-0.5 text-[10px] font-bold text-[#64748B]">
                    {label}
                </Text>
                <Text className="text-xs font-bold text-[#0F172A]">
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
            ? "bg-blue-50 text-blue-600 border border-blue-200"
            : normalizedStatus === "cancelled"
            ? "bg-red-50 text-red-600 border border-red-200"
            : normalizedStatus === "completed"
            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
            : "bg-blue-50 text-blue-600 border border-blue-200";

    return (
        <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={["top"]}>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />

            <View className="bg-white pb-2 pt-1 border-b border-[#F1F5F9]">
                <Navbar />
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center px-6">
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text className="mt-3 text-xs font-bold text-[#64748B]">
                        Loading reservation details...
                    </Text>
                </View>
            ) : !reservation ? (
                <View className="flex-1 items-center justify-center px-6">
                    <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl border border-red-100 bg-red-50">
                        <Ionicons
                            name="alert-circle-outline"
                            size={36}
                            color="#DC2626"
                        />
                    </View>

                    <Text className="text-base font-extrabold text-[#0F172A]">
                        Unable to Load Reservation
                    </Text>

                    <Text className="mt-1 text-center text-xs text-[#64748B]">
                        Check the error message and try again.
                    </Text>

                    <TouchableOpacity
                        className="mt-6 rounded-2xl bg-[#2563EB] px-6 py-3.5 shadow-sm"
                        onPress={getReservation}
                        activeOpacity={0.8}
                    >
                        <Text className="text-xs font-bold text-white">
                            Try Again
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="mt-3 p-2"
                        onPress={() => router.back()}
                    >
                        <Text className="text-xs font-bold text-[#64748B]">
                            Go Back
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{
                        padding: 20,
                        paddingBottom: 40,
                        width: "100%",
                        maxWidth: 850,
                        alignSelf: "center",
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mb-5 flex-row items-center self-start rounded-2xl border border-[#DBEAFE] bg-white px-4 py-2.5 shadow-sm"
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={18} color="#2563EB" />
                        <Text className="ml-2 text-xs font-bold text-[#2563EB]">
                            Back to Reservations
                        </Text>
                    </TouchableOpacity>

                    <View className="rounded-3xl border border-[#DBEAFE] bg-white p-5 shadow-sm">
                        <View className="flex-row items-start justify-between gap-3">
                            <View className="flex-1">
                                <Text className="text-[10px] font-black uppercase tracking-wider text-[#64748B]">
                                    RESERVATION ID
                                </Text>

                                <Text className="mt-1 text-xs font-bold text-[#0F172A]">
                                    {reservation._id || reservationId}
                                </Text>
                            </View>

                            <View
                                className={`rounded-xl px-3 py-1.5 ${statusClass.split(" ")[0]} ${statusClass.split(" ")[2]}`}
                            >
                                <Text
                                    className={`text-[10px] font-extrabold uppercase ${statusClass.split(" ")[1]}`}
                                >
                                    {status}
                                </Text>
                            </View>
                        </View>

                        <View className="my-5 h-px bg-[#F1F5F9]" />

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

                    <View className="mt-5 rounded-3xl border border-[#DBEAFE] bg-white p-5 shadow-sm">
                        <Text className="text-base font-black text-[#0F172A]">
                            Manage Reservation
                        </Text>

                        <Text className="mb-4 mt-1 text-xs text-[#64748B]">
                            Update the status of this reservation using the actions below.
                        </Text>

                        {isCancelled || isCompleted ? (
                            <View className="flex-row items-center rounded-2xl border border-[#DBEAFE] bg-[#EFF6FF] p-4">
                                <Ionicons
                                    name={
                                        isCancelled
                                            ? "close-circle"
                                            : "checkmark-circle"
                                    }
                                    size={22}
                                    color={isCancelled ? "#DC2626" : "#16A34A"}
                                />

                                <Text className="ml-3 flex-1 text-xs font-bold text-[#0F172A]">
                                    {isCancelled
                                        ? "This reservation has been cancelled."
                                        : "This reservation is completed."}
                                </Text>
                            </View>
                        ) : (
                            <>
                                {!isConfirmed && (
                                    <TouchableOpacity
                                        className={`flex-row items-center justify-center rounded-2xl bg-[#2563EB] px-4 py-4 shadow-sm ${
                                            updating ? "opacity-50" : ""
                                        }`}
                                        onPress={() =>
                                            confirmStatusUpdate("Confirmed")
                                        }
                                        disabled={updating}
                                        activeOpacity={0.8}
                                    >
                                        {updating ? (
                                            <ActivityIndicator color="#FFFFFF" />
                                        ) : (
                                            <>
                                                <Ionicons
                                                    name="checkmark-circle-outline"
                                                    size={18}
                                                    color="#FFFFFF"
                                                />
                                                <Text className="ml-2 text-xs font-bold text-white">
                                                    Confirm Reservation
                                                </Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    className={`mt-3 flex-row items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 py-4 ${
                                        updating ? "opacity-50" : ""
                                    }`}
                                    onPress={() =>
                                        confirmStatusUpdate("Cancelled")
                                    }
                                    disabled={updating}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons
                                        name="close-circle-outline"
                                        size={18}
                                        color="#DC2626"
                                    />
                                    <Text className="ml-2 text-xs font-bold text-red-600">
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