import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

const TabLayout = () => {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#2563EB",
                tabBarInactiveTintColor: "#6B7280",
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: "600",
                },
                tabBarStyle: {
                    height: 65,
                    paddingTop: 6,
                    paddingBottom: 6,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons
                            name="home-outline"
                            color={color}
                            size={size || 24}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="reservation"
                options={{
                    title: "Reservation",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons
                            name="calendar-outline"
                            color={color}
                            size={size || 24}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="bucket"
                options={{
                    title: "Bucket",
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons
                            name={focused ? "cart" : "cart-outline"}
                            color={color}
                            size={size || 26}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="checkout"
                options={{
                    title: "Checkout",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons
                            name="card-outline"
                            color={color}
                            size={size || 24}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="order"
                options={{
                    title: "Order",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons
                            name="receipt-outline"
                            color={color}
                            size={size || 24}
                        />
                    ),
                }}
            />
        </Tabs>
    );
};

export default TabLayout;