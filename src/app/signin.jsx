import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useRef, useState } from "react";
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

const Signin = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { login } = useAuth();
    const passwordInput = useRef(null);

    const [formData, setFormData] = useState({
        email: "",
        password: "",
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

    const handleSignin = async () => {
        Keyboard.dismiss();

        if (!formData.email.trim() || !formData.password) {
            showToast("error", "Please enter your email and password.");
            return;
        }

        const signinUrl = process.env.EXPO_PUBLIC_SIGNIN_URL;

        if (!signinUrl) {
            showToast("error", "Sign-in configuration is missing.");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                signinUrl,
                {
                    email: formData.email.trim(),
                    password: formData.password,
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

            if (!token) {
                console.log("Login response structure:", response.data);

                showToast(
                    "error",
                    "No authentication token returned. Please check your login API response."
                );
                return;
            }

            await AsyncStorage.setItem("token", token);

            const role = String(
                userData.role || response.data?.role || ""
            )
                .trim()
                .toLowerCase();

            login(userData);

            setFormData({
                email: "",
                password: "",
            });

            setShowPassword(false);

            showToast("success", "You have signed in successfully.");

            setTimeout(() => {
                if (role === "manager" || role === "admin") {
                    router.replace("/admin/dashboard");
                } else if (params.redirect === "/(tabs)/checkout") {
                    router.replace("/(tabs)/checkout");
                } else {
                    router.replace("/");
                }
            }, 3000);
        } catch (err) {
            console.error(
                "Sign-in error:",
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
                                Welcome{" "}
                                <Text className="text-[#2563EB]">
                                    back!
                                </Text>
                            </Text>

                            <Text className="mt-2 text-center font-semibold text-sm leading-6 text-[#64748B]">
                                Good Bite Makes Good Mood.
                            </Text>
                        </View>

                        {/* Signin Form Card */}
                        <View className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
                            {/* Email Input */}
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
                                    onSubmitEditing={() =>
                                        passwordInput.current?.focus()
                                    }
                                    blurOnSubmit={false}
                                />
                            </View>

                            {/* Password Input */}
                            <View className="mb-6">
                                <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-[#64748B]">
                                    Password
                                </Text>

                                <View className="h-14 flex-row items-center rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] pr-4">
                                    <TextInput
                                        ref={passwordInput}
                                        className="h-full flex-1 px-4 text-base text-[#0F172A]"
                                        placeholder="Enter your password"
                                        placeholderTextColor="#94A3B8"
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                        autoComplete="current-password"
                                        textContentType="password"
                                        returnKeyType="go"
                                        value={formData.password}
                                        onChangeText={(value) =>
                                            handleChange("password", value)
                                        }
                                        onSubmitEditing={handleSignin}
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

                            {/* Submit Button */}
                            <TouchableOpacity
                                className={`h-14 items-center justify-center rounded-2xl bg-[#2563EB] ${
                                    loading ? "opacity-70" : ""
                                }`}
                                onPress={handleSignin}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text className="text-base font-bold text-white">
                                        Sign In
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {/* Navigation Link */}
                            <View className="mt-6 flex-row flex-wrap justify-center">
                                <Text className="text-sm text-[#64748B]">
                                    Don't have an account?{" "}
                                </Text>

                                <Link
                                    href={{
                                        pathname: "/signup",
                                        params: params.redirect
                                            ? { redirect: params.redirect }
                                            : {},
                                    }}
                                    asChild
                                >
                                    <TouchableOpacity>
                                        <Text className="text-sm font-bold text-[#2563EB]">
                                            Sign Up
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

export default Signin;