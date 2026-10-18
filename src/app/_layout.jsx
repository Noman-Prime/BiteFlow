import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import "../global.css";

const RootLayout = () => {
    return (
        <AuthProvider>
            <CartProvider>
                <StatusBar style="dark" backgroundColor="#FFFFFF" />
                <Stack screenOptions={{ headerShown: false }} />
            </CartProvider>
        </AuthProvider>
    );
};

export default RootLayout;