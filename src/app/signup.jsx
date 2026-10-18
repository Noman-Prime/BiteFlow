import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Keyboard,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import logo from "../../assets/logo.png";
import Toast from "../components/Toast";
import { useAuth } from "../context/AuthContext";

const Signup = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "Customer",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [toast, setToast] = useState({
        visible: false,
        type: "success",
        message: "",
    });

    const hideToast = useCallback(() => {
        setToast((prev) => ({ ...prev, visible: false }));
    }, []);

    const showToast = (type, message) => {
        setToast({ visible: true, type, message });
    };

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSignup = async () => {
        Keyboard.dismiss();

        if (
            !formData.name.trim() ||
            !formData.email.trim() ||
            !formData.password
        ) {
            showToast("error", "Please complete all fields.");
            return;
        }

        if (formData.password.length < 8) {
            showToast(
                "error",
                "Your password must contain at least 8 characters."
            );
            return;
        }

        const signupUrl = process.env.EXPO_PUBLIC_SIGNUP_URL;

        if (!signupUrl) {
            showToast("error", "Signup configuration is missing.");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                signupUrl,
                {
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                    password: formData.password,
                    role: "Customer",
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    withCredentials: true,
                }
            );

            const userData =
                response.data?.user ||
                response.data?.data?.user ||
                {};

            const token =
                response.data?.token ||
                response.data?.data?.token ||
                response.data?.accessToken ||
                response.data?.data?.accessToken;

            if (token) {
                await AsyncStorage.setItem("token", token);
            }

            login(userData);

            setFormData({
                name: "",
                email: "",
                password: "",
                role: "Customer",
            });

            setShowPassword(false);

            showToast(
                "success",
                "Your BiteFlow account has been created!"
            );

            setTimeout(() => {
                if (params.redirect === "/(tabs)/checkout") {
                    router.replace("/(tabs)/checkout");
                } else {
                    router.replace("/");
                }
            }, 3000);
        } catch (err) {
            console.error(
                "Signup error:",
                err.response?.status,
                err.response?.data || err.message
            );

            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Please check your internet connection and try again.";

            showToast("error", message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView
            className="flex-1 bg-white"
            edges={["top", "left", "right"]}
        >
            <StatusBar style="dark" backgroundColor="#FFFFFF" />

            <View className="flex-1 bg-[#F8FAFC]">
                <KeyboardAwareScrollView
                    className="flex-1"
                    contentContainerStyle={{ flexGrow: 1 }}
                    enableOnAndroid
                    enableAutomaticScroll
                    extraScrollHeight={35}
                    extraHeight={100}
                    keyboardOpeningTime={0}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View
                        className="w-full flex-1 justify-center self-center px-6 py-8"
                        style={{ maxWidth: 520 }}
                    >
                        {/* Header & Logo */}
                        <View className="mb-8 items-center">
                            <View className="mb-5 flex-row items-center justify-center">
                                <View className="h-16 w-40 items-center justify-center rounded-2xl bg-[#EFF6FF] px-3 py-2 border border-[#DBEAFE]">
                                    <Image
                                        source={logo}
                                        resizeMode="contain"
                                        style={{ width: 130, height: 44 }}
                                    />
                                </View>
                            </View>

                            <Text className="text-3xl font-extrabold text-[#0F172A]">
                                Create{" "}
                                <Text className="text-[#2563EB]">
                                    Account
                                </Text>
                            </Text>

                            <Text className="mt-2 text-center text-sm leading-6 text-[#64748B]">
                                Join BiteFlow and get your favorite food delivered.
                            </Text>
                        </View>

                        {/* Signup Form Card */}
                        <View className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
                            {/* Full Name */}
                            <View className="mb-5">
                                <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-[#64748B]">
                                    Full name
                                </Text>

                                <TextInput
                                    className="h-14 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 text-base text-[#0F172A]"
                                    placeholder="Enter your full name"
                                    placeholderTextColor="#94A3B8"
                                    autoCapitalize="words"
                                    autoComplete="name"
                                    textContentType="name"
                                    returnKeyType="next"
                                    value={formData.name}
                                    onChangeText={(value) =>
                                        handleChange("name", value)
                                    }
                                />
                            </View>

                            {/* Email Address */}
                            <View className="mb-5">
                                <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-[#64748B]">
                                    Email address
                                </Text>

                                <TextInput
                                    className="h-14 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 text-base text-[#0F172A]"
                                    placeholder="you@example.com"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoComplete="email"
                                    textContentType="emailAddress"
                                    returnKeyType="next"
                                    value={formData.email}
                                    onChangeText={(value) =>
                                        handleChange("email", value)
                                    }
                                />
                            </View>

                            {/* Password */}
                            <View className="mb-5">
                                <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-[#64748B]">
                                    Password
                                </Text>

                                <View className="h-14 flex-row items-center rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] pr-4">
                                    <TextInput
                                        className="h-full flex-1 px-4 text-base text-[#0F172A]"
                                        placeholder="Min. 8 characters"
                                        placeholderTextColor="#94A3B8"
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                        autoComplete="new-password"
                                        textContentType="newPassword"
                                        returnKeyType="done"
                                        value={formData.password}
                                        onChangeText={(value) =>
                                            handleChange("password", value)
                                        }
                                        onSubmitEditing={handleSignup}
                                    />

                                    <TouchableOpacity
                                        onPress={() =>
                                            setShowPassword((prev) => !prev)
                                        }
                                        activeOpacity={0.7}
                                        accessibilityRole="button"
                                        accessibilityLabel={
                                            showPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                        hitSlop={{
                                            top: 10,
                                            bottom: 10,
                                            left: 10,
                                            right: 10,
                                        }}
                                    >
                                        <Ionicons
                                            name={
                                                showPassword
                                                    ? "eye-off-outline"
                                                    : "eye-outline"
                                            }
                                            size={22}
                                            color="#64748B"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Account Role Display */}
                            <View className="mb-6">
                                <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-[#64748B]">
                                    Account role
                                </Text>

                                <View className="h-14 flex-row items-center justify-between rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4">
                                    <Text className="text-base font-medium text-[#0F172A]">
                                        Customer
                                    </Text>

                                    <Ionicons
                                        name="checkmark-circle"
                                        size={22}
                                        color="#16A34A"
                                    />
                                </View>

                                <Text className="mt-2 text-xs leading-5 text-[#16A34A]">
                                    Customer registration is open.
                                </Text>
                            </View>

                            {/* Submit Button */}
                            <TouchableOpacity
                                className={`h-14 items-center justify-center rounded-2xl bg-[#2563EB] ${
                                    loading ? "opacity-70" : ""
                                }`}
                                onPress={handleSignup}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text className="text-base font-bold text-white">
                                        Create Account
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {/* Navigation Link */}
                            <View className="mt-6 flex-row flex-wrap justify-center">
                                <Text className="text-sm text-[#64748B]">
                                    Already have an account?{" "}
                                </Text>

                                <Link
                                    href={{
                                        pathname: "/signin",
                                        params: params.redirect
                                            ? { redirect: params.redirect }
                                            : {},
                                    }}
                                    asChild
                                >
                                    <TouchableOpacity>
                                        <Text className="text-sm font-bold text-[#2563EB]">
                                            Sign In
                                        </Text>
                                    </TouchableOpacity>
                                </Link>
                            </View>
                        </View>
                    </View>
                </KeyboardAwareScrollView>

                <Toast
                    visible={toast.visible}
                    type={toast.type}
                    message={toast.message}
                    onHide={hideToast}
                />
            </View>
        </SafeAreaView>
    );
};

export default Signup;