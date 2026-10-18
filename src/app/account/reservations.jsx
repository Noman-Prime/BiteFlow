import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Navbar from "../../components/Navbar";
import Toast from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";

const RESERVATIONS_API_URL =
    process.env.EXPO_PUBLIC_API_MY_RESERVATIONS_URL ||
    "https://mad-zwov.onrender.com/api/v1/my/reservations";

const ReservationHistory = () => {
    const router = useRouter();
    const { token } = useAuth();

    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
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

    const fetchReservations = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const savedToken =
                token || (await AsyncStorage.getItem("token"));

            if (!savedToken) {
                setReservations([]);
                setError("Please sign in to view your reservation history.");
                return;
            }

            const response = await fetch(RESERVATIONS_API_URL, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${savedToken}`,
                },
            });

            const contentType = response.headers.get("content-type") || "";
            const responseText = await response.text();

            let data = {};

            if (responseText) {
                try {
                    data = JSON.parse(responseText);
                } catch {
                    if (!response.ok) {
                        throw new Error(
                            `Server error (${response.status}). Please try again later.`
                        );
                    }

                    throw new Error(
                        "The server returned an invalid response. Please try again."
                    );
                }
            }

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error(
                        "Your session may have expired. Please sign in again."
                    );
                }

                throw new Error(
                    data.message ||
                        `Unable to fetch reservations (${response.status}).`
                );
            }

            if (
                contentType &&
                !contentType.toLowerCase().includes("application/json")
            ) {
                throw new Error(
                    "The server did not return JSON. Please check your backend API."
                );
            }

            const fetchedReservations = Array.isArray(data)
                ? data
                : Array.isArray(data.reservations)
                    ? data.reservations
                    : Array.isArray(data.data)
                        ? data.data
                        : Array.isArray(data.data?.reservations)
                            ? data.data.reservations
                            : null;

            if (!fetchedReservations) {
                throw new Error(
                    data.message ||
                        "Unexpected reservation data received from the server."
                );
            }

            setReservations(fetchedReservations);

            if (isRefresh) {
                showToast("success", "Reservation history updated.");
            }
        } catch (err) {
            console.error("Error fetching reservation history:", err);

            setError(
                err.message || "Unable to load your reservation history."
            );

            if (isRefresh) {
                showToast(
                    "error",
                    err.message || "Unable to refresh reservations."
                );
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useEffect(() => {
        fetchReservations();
    }, [fetchReservations]);

    const formatDate = (dateValue) => {
        if (!dateValue) return "Date unavailable";

        const parsedDate = new Date(dateValue);

        if (Number.isNaN(parsedDate.getTime())) {
            return String(dateValue);
        }

        return parsedDate.toLocaleDateString("en-PK", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const formatTime = (timeValue) => {
        if (!timeValue) return "Time unavailable";

        const value = String(timeValue);
        const timeMatch = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

        if (timeMatch) {
            const hours = Number(timeMatch[1]);
            const minutes = Number(timeMatch[2]);

            if (hours > 23 || minutes > 59) {
                return value;
            }

            const date = new Date();
            date.setHours(hours, minutes, 0, 0);

            return date.toLocaleTimeString("en-PK", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            });
        }

        const parsedDate = new Date(value);

        if (Number.isNaN(parsedDate.getTime())) {
            return value;
        }

        return parsedDate.toLocaleTimeString("en-PK", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    const getReservationStatus = (item) => {
        return (
            item.status ||
            item.reservationStatus ||
            item.bookingStatus ||
            "Pending"
        );
    };

    const getStatusStyle = (status) => {
        const normalizedStatus = String(status).toLowerCase();

        // Confirmed, Completed, Approved -> Emerald Green
        if (
            ["confirmed", "completed", "approved"].includes(normalizedStatus)
        ) {
            return {
                container: "bg-emerald-50 border-emerald-100",
                text: "text-emerald-700",
                color: "#059669",
            };
        }

        // Cancelled, Canceled, Rejected, Declined, Failed -> Red
        if (
            ["cancelled", "canceled", "rejected", "declined", "failed"].includes(
                normalizedStatus
            )
        ) {
            return {
                container: "bg-red-50 border-red-100",
                text: "text-red-600",
                color: "#DC2626",
            };
        }

        // Default -> Orange (Pending)
        return {
            container: "bg-orange-50 border-orange-100",
            text: "text-orange-600",
            color: "#F97316",
        };
    };

    const getReservationDate = (item) => {
        return (
            item.reservationDate ||
            item.bookingDate ||
            item.date ||
            item.reservationTime ||
            item.createdAt
        );
    };

    const getReservationTime = (item) => {
        return (
            item.time ||
            item.reservationTime ||
            item.bookingTime ||
            item.startTime
        );
    };

    const getGuestCount = (item) => {
        return (
            item.numberOfGuests ??
            item.guests ??
            item.guestCount ??
            item.people ??
            item.persons ??
            item.numberOfPeople ??
            item.partySize ??
            null
        );
    };

    const getTableName = (item) => {
        const table = item.table;

        if (typeof table === "string" || typeof table === "number") {
            return `Table ${table}`;
        }

        if (table && typeof table === "object") {
            return (
                table.name ||
                table.tableNumber ||
                table.number ||
                (table._id ? `Table #${String(table._id).slice(-6)}` : null)
            );
        }

        return item.tableNumber ? `Table ${item.tableNumber}` : null;
    };

    const renderReservationItem = ({ item }) => {
        const status = getReservationStatus(item);
        const statusStyle = getStatusStyle(status);
        const reservationId = item._id || item.id;
        const reservationDate = getReservationDate(item);
        const reservationTime = getReservationTime(item);
        const guestCount = getGuestCount(item);
        const tableName = getTableName(item);

        return (
            <View className="mb-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                <View className="mb-4 flex-row items-center justify-between border-b border-gray-100 pb-3">
                    <View className="flex-1 pr-3">
                        <Text className="text-sm font-black text-black">
                            {reservationId
                                ? `Booking #${String(reservationId)
                                    .slice(-6)
                                    .toUpperCase()}`
                                : "Table Reservation"}
                        </Text>

                        <Text className="mt-1 text-[10px] font-medium text-gray-400">
                            Booked on{" "}
                            {formatDate(item.createdAt || item.createdOn)}
                        </Text>
                    </View>

                    <View
                        className={`flex-row items-center rounded-xl border px-2.5 py-1.5 ${statusStyle.container}`}
                    >
                        <View
                            className="mr-1.5 h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: statusStyle.color }}
                        />

                        <Text
                            className={`text-[10px] font-extrabold uppercase ${statusStyle.text}`}
                        >
                            {status}
                        </Text>
                    </View>
                </View>

                <View className="mb-3 rounded-2xl bg-orange-50 p-4">
                    <View className="mb-3 flex-row items-center">
                        <View className="h-11 w-11 items-center justify-center rounded-2xl border border-orange-100 bg-white">
                            <Ionicons
                                name="calendar-outline"
                                size={22}
                                color="#F97316"
                            />
                        </View>

                        <View className="ml-3 flex-1">
                            <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                Reservation Date
                            </Text>

                            <Text className="mt-1 text-sm font-black text-black">
                                {formatDate(reservationDate)}
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row items-center border-t border-orange-100 pt-3">
                        <Ionicons
                            name="time-outline"
                            size={17}
                            color="#F97316"
                        />

                        <Text className="ml-2 text-xs font-bold text-gray-600">
                            {formatTime(reservationTime)}
                        </Text>
                    </View>
                </View>

                <View className="flex-row flex-wrap">
                    {guestCount !== null && (
                        <View className="mb-2 mr-2 flex-row items-center rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                            <Ionicons
                                name="people-outline"
                                size={16}
                                color="#6B7280"
                            />

                            <Text className="ml-2 text-xs font-bold text-gray-600">
                                {guestCount}{" "}
                                {Number(guestCount) === 1 ? "Guest" : "Guests"}
                            </Text>
                        </View>
                    )}

                    {tableName && (
                        <View className="mb-2 flex-row items-center rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                            <Ionicons
                                name="restaurant-outline"
                                size={16}
                                color="#6B7280"
                            />

                            <Text className="ml-2 text-xs font-bold text-gray-600">
                                {tableName}
                            </Text>
                        </View>
                    )}
                </View>

                {item.specialRequest || item.notes || item.description ? (
                    <View className="mt-1 border-t border-gray-100 pt-3">
                        <Text className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                            Special Request
                        </Text>

                        <Text className="text-xs leading-5 text-gray-600">
                            {item.specialRequest ||
                                item.notes ||
                                item.description}
                        </Text>
                    </View>
                ) : null}
            </View>
        );
    };

    const renderEmptyReservations = () => (
        <View className="flex-1 items-center justify-center px-8 py-16">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl border border-orange-100 bg-orange-50">
                <Ionicons
                    name="calendar-outline"
                    size={36}
                    color="#F97316"
                />
            </View>

            <Text className="text-lg font-extrabold text-black">
                No Reservations Yet
            </Text>

            <Text className="mt-2 text-center text-xs leading-5 text-gray-500">
                Your table reservations will appear here after you make a
                booking.
            </Text>

            <TouchableOpacity
                onPress={() => router.replace("/")}
                activeOpacity={0.8}
                className="mt-6 flex-row items-center rounded-2xl bg-black px-6 py-3.5"
            >
                <Ionicons
                    name="restaurant-outline"
                    size={17}
                    color="#FFFFFF"
                />

                <Text className="ml-2 text-xs font-bold text-white">
                    Explore BiteFlow
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderError = () => (
        <View className="flex-1 items-center justify-center px-8 py-12">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl border border-red-100 bg-red-50">
                <Ionicons
                    name="alert-circle-outline"
                    size={32}
                    color="#DC2626"
                />
            </View>

            <Text className="text-base font-extrabold text-black">
                Unable to Load Reservations
            </Text>

            <Text className="mt-2 text-center text-xs leading-5 text-gray-500">
                {error}
            </Text>

            <TouchableOpacity
                onPress={() => fetchReservations()}
                activeOpacity={0.8}
                className="mt-5 flex-row items-center rounded-2xl bg-black px-6 py-3.5"
            >
                <Ionicons name="refresh" size={16} color="#FFFFFF" />

                <Text className="ml-2 text-xs font-bold text-white">
                    Try Again
                </Text>
            </TouchableOpacity>

            {(error.toLowerCase().includes("sign in") ||
                error.toLowerCase().includes("session")) && (
                <TouchableOpacity
                    onPress={() => router.replace("/signin")}
                    activeOpacity={0.8}
                    className="mt-3 rounded-2xl border border-gray-200 px-6 py-3"
                >
                    <Text className="text-xs font-bold text-black">
                        Go to Sign In
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView
            className="flex-1 bg-gray-50"
            edges={["top", "left", "right"]}
        >
            <StatusBar style="light" backgroundColor="#000000" />

            <Navbar />

            <View className="flex-row items-center justify-between bg-black px-5 pb-5 pt-2">
                <TouchableOpacity
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                    className="h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10"
                >
                    <Ionicons
                        name="arrow-back"
                        size={21}
                        color="#FFFFFF"
                    />
                </TouchableOpacity>

                <View className="flex-1 items-center">
                    <Text className="text-base font-black text-white">
                        Reservation History
                    </Text>

                    <Text className="mt-0.5 text-[10px] font-medium text-gray-400">
                        Your BiteFlow bookings
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={() => fetchReservations(true)}
                    disabled={loading || refreshing}
                    activeOpacity={0.7}
                    className="h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10"
                >
                    <Ionicons
                        name="refresh"
                        size={20}
                        color="#FFFFFF"
                    />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center p-6">
                    <ActivityIndicator
                        size="large"
                        color="#F97316"
                    />

                    <Text className="mt-3 text-xs font-bold text-gray-500">
                        Loading reservation history...
                    </Text>
                </View>
            ) : error ? (
                renderError()
            ) : (
                <FlatList
                    data={reservations}
                    keyExtractor={(item, index) =>
                        String(item._id || item.id || index)
                    }
                    renderItem={renderReservationItem}
                    ListHeaderComponent={
                        reservations.length > 0 ? (
                            <View className="mb-4 flex-row items-center justify-between">
                                <View>
                                    <Text className="text-lg font-black text-black">
                                        Your Reservations
                                    </Text>

                                    <Text className="mt-1 text-xs text-gray-500">
                                        Review your previous bookings
                                    </Text>
                                </View>

                                <View className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-2">
                                    <Text className="text-xs font-extrabold text-orange-700">
                                        {reservations.length}{" "}
                                        {reservations.length === 1
                                            ? "Booking"
                                            : "Bookings"}
                                    </Text>
                                </View>
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={renderEmptyReservations}
                    contentContainerStyle={{
                        paddingHorizontal: 20,
                        paddingTop: 20,
                        paddingBottom: 40,
                        flexGrow: 1,
                    }}
                    showsVerticalScrollIndicator={false}
                    onRefresh={() => fetchReservations(true)}
                    refreshing={refreshing}
                />
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

export default ReservationHistory;