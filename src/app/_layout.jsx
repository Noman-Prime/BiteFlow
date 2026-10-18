
import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import "../global.css";

const RootLayout = () => {
    return (
        <AuthProvider>
            <CartProvider>
                <Stack screenOptions={{ headerShown: false }} />
            </CartProvider>
        </AuthProvider>
    );
};

export default RootLayout;
