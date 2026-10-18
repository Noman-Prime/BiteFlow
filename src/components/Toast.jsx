import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";

const Toast = ({
    visible,
    type = "success",
    message,
    onHide,
    onConfirm,
}) => {
    const isConfirm = type === "confirm";
    const isSuccess = type === "success";

    useEffect(() => {
        if (!visible || isConfirm) return;

        const timer = setTimeout(() => {
            onHide?.();
        }, 3000);

        return () => clearTimeout(timer);
    }, [visible, message, isConfirm, onHide]);

    if (!visible) return null;

    return (
        <View
            pointerEvents="box-none"
            className="absolute left-5 right-5 top-14 z-50"
        >
            <View
                pointerEvents="auto"
                className="flex-row items-start rounded-3xl border border-gray-100 bg-white p-4 shadow-xl shadow-gray-200"
            >
                {/* Icon Container */}
                <View
                    className={`mr-3 h-11 w-11 items-center justify-center rounded-2xl ${
                        isConfirm
                            ? "bg-orange-50 border border-orange-100"
                            : isSuccess
                                ? "bg-emerald-50 border border-emerald-100"
                                : "bg-red-50 border border-red-100"
                    }`}
                >
                    <Ionicons
                        name={
                            isConfirm
                                ? "help-circle-outline"
                                : isSuccess
                                    ? "checkmark-circle-outline"
                                    : "close-circle-outline"
                        }
                        size={22}
                        color={
                            isConfirm
                                ? "#F97316"
                                : isSuccess
                                    ? "#10B981"
                                    : "#EF4444"
                        }
                    />
                </View>

                {/* Text & Action Section */}
                <View className="flex-1 pr-1">
                    <Text
                        className={`text-xs font-bold uppercase tracking-wider ${
                            isConfirm
                                ? "text-orange-600"
                                : isSuccess
                                    ? "text-emerald-600"
                                    : "text-red-600"
                        }`}
                    >
                        {isConfirm
                            ? "Confirm Action"
                            : isSuccess
                                ? "Success"
                                : "Error"}
                    </Text>

                    <Text className="mt-1 text-xs font-semibold leading-relaxed text-black">
                        {message}
                    </Text>

                    {/* Confirm Buttons */}
                    {isConfirm && (
                        <View className="mt-4 flex-row gap-2.5">
                            <TouchableOpacity
                                onPress={onHide}
                                activeOpacity={0.8}
                                className="flex-1 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 py-2.5"
                            >
                                <Text className="text-xs font-bold text-gray-700">
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={onConfirm}
                                activeOpacity={0.8}
                                className="flex-1 items-center justify-center rounded-2xl bg-emerald-600 py-2.5 shadow-sm shadow-emerald-200"
                            >
                                <Text className="text-xs font-bold text-white">
                                    Confirm
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

export default Toast;