
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";

const TABLES_URL = process.env.EXPO_PUBLIC_TABLE_URL;
const AVAILABILITY_URL = process.env.EXPO_PUBLIC_TABLE_AVAILABILITY_URL;
const CREATE_RESERVATION_URL =
    process.env.EXPO_PUBLIC_CREATE_RESERVATION_URL ||
    "https://mad-zwov.onrender.com/api/v1/new/reservation";

const OPENING_HOUR = 9;
const CLOSING_HOUR = 22;
const BOOKING_MINUTES = 60;

const formatDate = (value) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const formatTime = (value) => {
    const hours = String(value.getHours()).padStart(2, "0");
    const minutes = String(value.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
};

const displayTime = (value) =>
    value.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });

const getArray = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.tables)) return response.tables;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.tables)) return response.data.tables;
    if (Array.isArray(response?.data?.data?.tables)) {
        return response.data.data.tables;
    }

    return [];
};

const getTableId = (table) => table?._id || table?.id;

const getTableName = (table) =>
    table?.tableNumber
        ? `Table ${table.tableNumber}`
        : table?.tableName || table?.name || "Table";

const getToken = async (user) =>
    user?.token || (await AsyncStorage.getItem("token"));

const Reservation = () => {
    const router = useRouter();
    const { user } = useAuth();

    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const [startDateTime, setStartDateTime] = useState(() => {
        const value = new Date();
        value.setHours(10, 0, 0, 0);
        return value;
    });

    const [guests, setGuests] = useState(2);
    const [pickerType, setPickerType] = useState(null);
    const [pickerValue, setPickerValue] = useState(new Date());

    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showAvailabilityOptions, setShowAvailabilityOptions] =
        useState(false);
    const [reservedSlots, setReservedSlots] = useState([]);

    const endDateTime = new Date(
        startDateTime.getTime() + BOOKING_MINUTES * 60 * 1000
    );

    const date = formatDate(selectedDate);
    const startTime = formatTime(startDateTime);
    const endTime = formatTime(endDateTime);

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        try {
            setLoading(true);

            if (!TABLES_URL) {
                throw new Error("EXPO_PUBLIC_TABLE_URL is missing.");
            }

            const token = await getToken(user);
            const response = await axios.get(TABLES_URL, {
                headers: token
                    ? { Authorization: `Bearer ${token}` }
                    : {},
            });

            setTables(
                getArray(response.data).map((table) => ({
                    ...table,
                    slotStatus: null,
                }))
            );
        } catch (error) {
            Alert.alert(
                "Unable to Load Tables",
                error.response?.data?.message ||
                    error.message ||
                    "Please try again later."
            );
        } finally {
            setLoading(false);
        }
    };

    const resetAvailability = () => {
        setReservedSlots([]);
        setTables((current) =>
            current.map((table) => ({ ...table, slotStatus: null }))
        );
        setSelectedTable((current) =>
            current ? { ...current, slotStatus: null } : null
        );
    };

    const openPicker = (type) => {
        setPickerValue(
            type === "date" ? selectedDate : new Date(startDateTime)
        );
        setPickerType(type);
    };

    const confirmPicker = (value) => {
        if (!value) {
            setPickerType(null);
            return;
        }

        if (pickerType === "date") {
            const newDate = new Date(value);
            newDate.setHours(0, 0, 0, 0);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (newDate < today) {
                Alert.alert(
                    "Invalid Date",
                    "Please select today or a future date."
                );
                setPickerType(null);
                return;
            }

            setSelectedDate(newDate);
        } else {
            const newTime = new Date(startDateTime);
            newTime.setHours(value.getHours(), value.getMinutes(), 0, 0);
            setStartDateTime(newTime);
        }

        resetAvailability();
        setPickerType(null);
    };

    const validateBooking = () => {
        const today = new Date();
        const bookingDate = new Date(selectedDate);
        bookingDate.setHours(0, 0, 0, 0);

        const todayDate = new Date(today);
        todayDate.setHours(0, 0, 0, 0);

        if (bookingDate < todayDate) {
            Alert.alert(
                "Invalid Date",
                "Please select today or a future date."
            );
            return false;
        }

        const startMinutes =
            startDateTime.getHours() * 60 + startDateTime.getMinutes();
        const endMinutes = startMinutes + BOOKING_MINUTES;

        if (
            startDateTime.getHours() < OPENING_HOUR ||
            endMinutes > CLOSING_HOUR * 60
        ) {
            Alert.alert(
                "Outside Opening Hours",
                "Choose a start time between 9:00 AM and 9:00 PM."
            );
            return false;
        }

        if (
            formatDate(selectedDate) === formatDate(today) &&
            startDateTime.getTime() <= Date.now()
        ) {
            Alert.alert(
                "Invalid Time",
                "Please select a future start time."
            );
            return false;
        }

        if (guests < 1) {
            Alert.alert("Guests Required", "Select at least one guest.");
            return false;
        }

        return true;
    };

    const checkAvailability = async (table = selectedTable) => {
        if (!validateBooking()) return;

        if (!AVAILABILITY_URL) {
            Alert.alert(
                "Availability API Missing",
                "Configure EXPO_PUBLIC_TABLE_AVAILABILITY_URL and confirm that the backend availability route exists."
            );
            return;
        }

        try {
            setChecking(true);
            setSelectedTable(table);
            setReservedSlots([]);

            const token = await getToken(user);
            const params = {
                date,
                startTime,
                endTime,
                guests: Number(guests),
            };

            if (table) {
                params.tableId = getTableId(table);
            }

            const response = await axios.get(AVAILABILITY_URL, {
                params,
                headers: token
                    ? { Authorization: `Bearer ${token}` }
                    : {},
            });

            const data = response.data?.data || response.data;

            const availableIds = new Set(
                (data.availableTables || []).map((item) =>
                    String(
                        typeof item === "object"
                            ? getTableId(item)
                            : item
                    )
                )
            );

            const slots =
                data.reservedSlots ||
                data.reservations ||
                data.bookedSlots ||
                [];

            setReservedSlots(slots);

            if (table) {
                const tableIsAvailable =
                    data.available === true ||
                    data.isAvailable === true ||
                    availableIds.has(String(getTableId(table)));

                const updatedTable = {
                    ...table,
                    slotStatus: tableIsAvailable
                        ? "available"
                        : "reserved",
                };

                setSelectedTable(updatedTable);
                setTables((current) =>
                    current.map((item) =>
                        String(getTableId(item)) ===
                        String(getTableId(table))
                            ? updatedTable
                            : item
                    )
                );
            } else {
                setTables((current) =>
                    current.map((item) => ({
                        ...item,
                        slotStatus: availableIds.has(
                            String(getTableId(item))
                        )
                            ? "available"
                            : "reserved",
                    }))
                );
            }
        } catch (error) {
            Alert.alert(
                "Availability Error",
                error.response?.data?.message ||
                    "Could not check availability. Please try again."
            );
        } finally {
            setChecking(false);
        }
    };

    const openTableOptions = (table) => {
        setSelectedTable(table);
        setReservedSlots([]);
        setShowAvailabilityOptions(true);
    };

    const openMyReservations = async () => {
        try {
            const token = await getToken(user);

            if (!token) {
                Alert.alert(
                    "Sign In Required",
                    "Please sign in to view your reservations.",
                    [
                        { text: "Cancel", style: "cancel" },
                        {
                            text: "Sign In",
                            onPress: () => router.push("/signin"),
                        },
                    ]
                );
                return;
            }

            router.push("/account/reservations");
        } catch {
            Alert.alert(
                "Sign In Required",
                "Please sign in to view your reservations.",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Sign In",
                        onPress: () => router.push("/signin"),
                    },
                ]
            );
        }
    };

    const createReservation = async () => {
        if (!selectedTable || selectedTable.slotStatus !== "available") {
            Alert.alert(
                "Unavailable",
                "Check availability and select an available table first."
            );
            return;
        }

        if (!validateBooking()) return;

        try {
            setSubmitting(true);

            const token = await getToken(user);

            if (!token) {
                Alert.alert(
                    "Sign In Required",
                    "Please sign in before making a reservation.",
                    [
                        { text: "Cancel", style: "cancel" },
                        {
                            text: "Sign In",
                            onPress: () => router.push("/signin"),
                        },
                    ]
                );
                return;
            }

            const response = await axios.post(
                CREATE_RESERVATION_URL,
                {
                    table: getTableId(selectedTable),
                    date,
                    startTime,
                    guests: Number(guests),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            Alert.alert(
                "Reservation Submitted",
                response.data?.message ||
                    "Your reservation request has been submitted.",
                [
                    {
                        text: "My Reservations",
                        onPress: () => {
                            setShowAvailabilityOptions(false);
                            router.push("/account/reservations");
                        },
                    },
                    {
                        text: "Done",
                        onPress: () => {
                            setShowAvailabilityOptions(false);
                            setSelectedTable(null);
                        },
                    },
                ]
            );
        } catch (error) {
            Alert.alert(
                "Reservation Failed",
                error.response?.data?.message ||
                    "Unable to create your reservation. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const getTableColor = (table) => {
        if (table.slotStatus === "available") return "#16A34A";
        if (table.slotStatus === "reserved") return "#DC2626";

        if (
            table.status &&
            String(table.status).toLowerCase() !== "available"
        ) {
            return "#6B7280";
        }

        return "#D1D5DB";
    };

    const renderBookingOptions = () => (
        <View className="mt-5 rounded-2xl border border-gray-200 bg-white p-5">
            <View className="mb-4 flex-row items-center justify-between">
                <View className="flex-1">
                    <Text className="text-xl font-extrabold text-gray-900">
                        {selectedTable
                            ? `Reserve ${getTableName(selectedTable)}`
                            : "Check Availability"}
                    </Text>
                    <Text className="mt-1 text-sm text-gray-500">
                        Select a date, time, and number of guests.
                    </Text>
                </View>

                <TouchableOpacity
                    className="ml-2 rounded-full bg-gray-100 p-2"
                    onPress={() => {
                        setShowAvailabilityOptions(false);
                        setSelectedTable(null);
                    }}
                >
                    <Ionicons name="close" size={21} color="#374151" />
                </TouchableOpacity>
            </View>

            <Text className="mb-2 mt-2 font-bold text-gray-700">
                Reservation Date
            </Text>

            <TouchableOpacity
                className="flex-row items-center gap-3 rounded-xl border border-gray-300 p-4"
                onPress={() => openPicker("date")}
            >
                <Ionicons
                    name="calendar-outline"
                    size={21}
                    color="#F97316"
                />
                <Text className="flex-1 font-semibold text-gray-900">
                    {selectedDate.toLocaleDateString("en-US", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                    })}
                </Text>
                <Ionicons
                    name="chevron-down"
                    size={18}
                    color="#6B7280"
                />
            </TouchableOpacity>

            <Text className="mb-2 mt-4 font-bold text-gray-700">
                Start Time
            </Text>

            <TouchableOpacity
                className="flex-row items-center gap-3 rounded-xl border border-gray-300 p-4"
                onPress={() => openPicker("time")}
            >
                <Ionicons name="time-outline" size={21} color="#F97316" />
                <Text className="flex-1 font-semibold text-gray-900">
                    {displayTime(startDateTime)}
                </Text>
                <Ionicons
                    name="chevron-down"
                    size={18}
                    color="#6B7280"
                />
            </TouchableOpacity>

            <View className="mt-4 flex-row items-center gap-3 rounded-xl bg-green-50 p-3">
                <Ionicons
                    name="checkmark-circle-outline"
                    size={23}
                    color="#16A34A"
                />
                <View className="flex-1">
                    <Text className="text-xs text-green-800">
                        Booking Duration
                    </Text>
                    <Text className="mt-1 font-extrabold text-green-800">
                        {displayTime(startDateTime)} –{" "}
                        {displayTime(endDateTime)}
                    </Text>
                </View>
                <Text className="text-xs font-bold text-green-800">
                    1 HOUR
                </Text>
            </View>

            <Text className="mb-2 mt-4 font-bold text-gray-700">
                Number of Guests
            </Text>

            <View className="flex-row items-center justify-between rounded-xl border border-gray-300 p-2">
                <TouchableOpacity
                    className="h-10 w-10 items-center justify-center rounded-lg bg-gray-100"
                    disabled={guests <= 1}
                    onPress={() => setGuests((value) => value - 1)}
                >
                    <Ionicons
                        name="remove"
                        size={22}
                        color={guests <= 1 ? "#D1D5DB" : "#374151"}
                    />
                </TouchableOpacity>

                <View className="flex-row items-center gap-2">
                    <Ionicons
                        name="people-outline"
                        size={20}
                        color="#F97316"
                    />
                    <Text className="text-lg font-extrabold text-gray-900">
                        {guests}
                    </Text>
                    <Text className="text-sm text-gray-500">
                        {guests === 1 ? "Guest" : "Guests"}
                    </Text>
                </View>

                <TouchableOpacity
                    className="h-10 w-10 items-center justify-center rounded-lg bg-gray-100"
                    onPress={() => setGuests((value) => value + 1)}
                >
                    <Ionicons name="add" size={22} color="#374151" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                className={`mt-5 flex-row items-center justify-center gap-2 rounded-xl bg-orange-500 p-4 ${
                    checking ? "opacity-60" : ""
                }`}
                onPress={() => checkAvailability(selectedTable)}
                disabled={checking}
            >
                {checking ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <>
                        <Ionicons
                            name="search-outline"
                            size={21}
                            color="#FFFFFF"
                        />
                        <Text className="font-extrabold text-white">
                            {selectedTable
                                ? "Check This Table"
                                : "Check All Tables"}
                        </Text>
                    </>
                )}
            </TouchableOpacity>

            {selectedTable?.slotStatus === "available" && (
                <View className="mt-4">
                    <View className="flex-row items-center gap-2 rounded-xl bg-green-50 p-3">
                        <Ionicons
                            name="checkmark-circle"
                            size={23}
                            color="#16A34A"
                        />
                        <Text className="flex-1 font-bold text-green-800">
                            This table is available!
                        </Text>
                    </View>

                    <TouchableOpacity
                        className={`mt-3 items-center justify-center rounded-xl bg-orange-500 p-4 ${
                            submitting ? "opacity-60" : ""
                        }`}
                        onPress={createReservation}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text className="font-extrabold text-white">
                                Confirm Reservation
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {selectedTable?.slotStatus === "reserved" && (
                <View className="mt-4 flex-row items-center gap-2 rounded-xl bg-red-50 p-3">
                    <Ionicons
                        name="close-circle"
                        size={23}
                        color="#DC2626"
                    />
                    <Text className="flex-1 font-bold text-red-800">
                        This table is unavailable for the selected time.
                    </Text>
                </View>
            )}

            {reservedSlots.length > 0 && (
                <View className="mt-4">
                    <Text className="mb-2 font-extrabold text-gray-900">
                        Existing Booked Slots
                    </Text>

                    {reservedSlots.map((slot, index) => (
                        <View
                            key={slot._id || index}
                            className="flex-row items-center gap-2 py-2"
                        >
                            <Ionicons
                                name="time-outline"
                                size={18}
                                color="#DC2626"
                            />
                            <Text className="text-sm text-gray-600">
                                {slot.startTime || slot.start} –{" "}
                                {slot.endTime || slot.end}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            <Text className="mt-3 text-center text-xs leading-5 text-gray-500">
                Open daily from 9:00 AM to 10:00 PM. Reservations last one
                hour.
            </Text>
        </View>
    );

    const renderPicker = () => {
        if (!pickerType) return null;

        return (
            <Modal
                transparent
                animationType="fade"
                visible={Boolean(pickerType)}
                onRequestClose={() => setPickerType(null)}
            >
                <View className="flex-1 items-center justify-center bg-black/60 p-5">
                    <View className="w-full max-w-md items-center rounded-2xl bg-white p-5">
                        <Text className="mb-4 text-lg font-extrabold text-gray-900">
                            {pickerType === "date"
                                ? "Select Reservation Date"
                                : "Select Start Time"}
                        </Text>

                        <DateTimePicker
                            value={pickerValue}
                            mode={pickerType}
                            display={
                                Platform.OS === "ios" ? "spinner" : "default"
                            }
                            minimumDate={
                                pickerType === "date"
                                    ? new Date()
                                    : undefined
                            }
                            minuteInterval={15}
                            onChange={(event, value) => {
                                if (Platform.OS === "android") {
                                    if (event.type === "set" && value) {
                                        confirmPicker(value);
                                    } else {
                                        setPickerType(null);
                                    }
                                } else if (value) {
                                    setPickerValue(value);
                                }
                            }}
                            themeVariant="light"
                        />

                        {Platform.OS === "ios" && (
                            <TouchableOpacity
                                className="mt-4 w-full items-center rounded-xl bg-orange-500 p-4"
                                onPress={() => confirmPicker(pickerValue)}
                            >
                                <Text className="font-bold text-white">
                                    Confirm Selection
                                </Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            className="mt-3 p-3"
                            onPress={() => setPickerType(null)}
                        >
                            <Text className="font-semibold text-gray-500">
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar style="dark" />
            <Navbar />

            <ScrollView
                contentContainerStyle={{
                    paddingHorizontal: 18,
                    paddingTop: 20,
                    paddingBottom: 45,
                }}
                showsVerticalScrollIndicator={false}
            >
                <View className="mb-5">
                    <Text className="text-3xl font-extrabold text-gray-900">
                        Reserve a Table
                    </Text>
                    <Text className="mt-1 text-sm text-gray-500">
                        Choose your table and reserve your preferred time.
                    </Text>
                </View>

                <View className="mb-6 gap-3">
                    <TouchableOpacity
                        className="flex-row items-center gap-3 rounded-xl bg-orange-500 p-4"
                        onPress={() => {
                            setSelectedTable(null);
                            setReservedSlots([]);
                            setShowAvailabilityOptions(true);
                        }}
                    >
                        <View className="h-11 w-11 items-center justify-center rounded-full bg-white/20">
                            <Ionicons
                                name="search-outline"
                                size={24}
                                color="#FFFFFF"
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="font-extrabold text-white">
                                Check Availability
                            </Text>
                            <Text className="mt-1 text-xs text-white">
                                Choose a date and time for your visit
                            </Text>
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={21}
                            color="#FFFFFF"
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="flex-row items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4"
                        onPress={openMyReservations}
                    >
                        <View className="h-11 w-11 items-center justify-center rounded-full bg-orange-100">
                            <Ionicons
                                name="calendar-outline"
                                size={24}
                                color="#F97316"
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="font-extrabold text-orange-800">
                                My Reservations
                            </Text>
                            <Text className="mt-1 text-xs text-orange-700">
                                View your bookings and their status
                            </Text>
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={21}
                            color="#F97316"
                        />
                    </TouchableOpacity>
                </View>

                <View className="mb-3 flex-row items-center justify-between">
                    <Text className="text-lg font-extrabold text-gray-900">
                        Choose Your Table
                    </Text>
                    <Text className="text-sm text-gray-500">
                        {tables.length} tables
                    </Text>
                </View>

                <Text className="mb-4 text-sm leading-5 text-gray-500">
                    Select any table to choose your date and time. You can
                    check availability before confirming your reservation.
                </Text>

                {loading ? (
                    <ActivityIndicator
                        size="large"
                        color="#F97316"
                        style={{ marginVertical: 35 }}
                    />
                ) : tables.length === 0 ? (
                    <View className="items-center rounded-2xl bg-white p-8">
                        <Ionicons
                            name="restaurant-outline"
                            size={40}
                            color="#9CA3AF"
                        />
                        <Text className="mt-3 text-gray-500">
                            No tables found.
                        </Text>
                        <TouchableOpacity
                            className="mt-4 rounded-xl bg-orange-500 px-5 py-3"
                            onPress={fetchTables}
                        >
                            <Text className="font-bold text-white">
                                Try Again
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View className="flex-row flex-wrap gap-3">
                        {tables.map((table) => {
                            const tableId = getTableId(table);
                            const color = getTableColor(table);
                            const isSelected =
                                String(getTableId(selectedTable)) ===
                                String(tableId);

                            return (
                                <TouchableOpacity
                                    key={tableId}
                                    className={`min-w-[45%] flex-1 items-center rounded-2xl border bg-white p-4 ${
                                        isSelected
                                            ? "border-orange-500"
                                            : "border-gray-200"
                                    }`}
                                    style={{ borderColor: isSelected ? "#F97316" : color }}
                                    onPress={() => openTableOptions(table)}
                                >
                                    <View
                                        className="mb-3 h-14 w-14 items-center justify-center rounded-full"
                                        style={{
                                            backgroundColor: `${color}18`,
                                        }}
                                    >
                                        <Ionicons
                                            name="restaurant-outline"
                                            size={28}
                                            color={color}
                                        />
                                    </View>

                                    <Text className="text-center text-base font-extrabold text-gray-900">
                                        {getTableName(table)}
                                    </Text>

                                    <View className="mt-2 flex-row items-center gap-1">
                                        <Ionicons
                                            name="people-outline"
                                            size={15}
                                            color="#6B7280"
                                        />
                                        <Text className="text-sm text-gray-500">
                                            {table.capacity ||
                                                table.seatingCapacity ||
                                                "—"}{" "}
                                            seats
                                        </Text>
                                    </View>

                                    <Text
                                        className="mt-3 text-center text-xs font-bold"
                                        style={{ color }}
                                    >
                                        {table.slotStatus === "available"
                                            ? "Available"
                                            : table.slotStatus === "reserved"
                                              ? "Unavailable"
                                              : table.status &&
                                                  String(
                                                      table.status
                                                  ).toLowerCase() !==
                                                      "available"
                                                ? String(table.status)
                                                : "Select Table"}
                                    </Text>

                                    <Text className="mt-2 text-xs font-bold text-orange-600">
                                        Check Times
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {showAvailabilityOptions && renderBookingOptions()}
            </ScrollView>

            {renderPicker()}
        </View>
    );
};

export default Reservation;