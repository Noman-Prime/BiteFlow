import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Navbar from "../../components/Navbar";

const managementSections = [
  {
    title: "Users",
    description: "View and manage registered users.",
    icon: "people-outline",
    route: "/admin/user",
  },
  {
    title: "Menus",
    description: "Create, update, delete, and view food items.",
    icon: "restaurant-outline",
    route: "/admin/menu",
  },
  {
    title: "Tables",
    description: "Manage restaurant tables and their availability.",
    icon: "grid-outline",
    route: "/admin/table",
  },
  {
    title: "Reservations",
    description: "View and manage customer table reservations.",
    icon: "calendar-outline",
    route: "/admin/reservation",
  },
  {
    title: "Orders",
    description: "View orders and manage their status.",
    icon: "receipt-outline",
    route: "/admin/order",
  },
];

const AdminDashboard = () => {
  const router = useRouter();

  const handleNavigation = (section) => {
    console.log("Navigating to:", section.route);
    router.navigate(section.route);
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      edges={["top", "left", "right"]}
    >
      <StatusBar style="dark" backgroundColor="#FFFFFF" />

      <View className="flex-1 bg-[#F8FAFC]">
        <Navbar />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            padding: 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full self-center" style={{ maxWidth: 600 }}>
            {/* Header Section */}
            <View className="mb-8 mt-2">
              <Text className="mb-2 text-3xl font-extrabold text-[#0F172A]">
                Manager <Text className="text-[#2563EB]">Dashboard</Text>
              </Text>

              <Text className="text-base font-medium leading-6 text-[#64748B]">
                Manage your BiteFlow restaurant, menus, customers, and
                reservations from one place.
              </Text>
            </View>

            {/* Section Counter Bar */}
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-[#0F172A]">
                Management
              </Text>

              <View className="rounded-full bg-[#EFF6FF] border border-[#DBEAFE] px-3 py-1">
                <Text className="text-sm font-extrabold text-[#2563EB]">
                  {managementSections.length} Sections
                </Text>
              </View>
            </View>

            {/* Management Cards List */}
            <View className="gap-4">
              {managementSections.map((section) => (
                <TouchableOpacity
                  key={section.title}
                  className="flex-row items-center rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm"
                  onPress={() => handleNavigation(section)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`Manage ${section.title}`}
                >
                  <View className="mr-4 h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE]">
                    <Ionicons
                      name={section.icon}
                      size={26}
                      color="#2563EB"
                    />
                  </View>

                  <View className="flex-1 pr-2">
                    <Text className="mb-1 text-base font-bold text-[#0F172A]">
                      {section.title}
                    </Text>

                    <Text className="text-sm leading-5 text-[#64748B]">
                      {section.description}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default AdminDashboard;