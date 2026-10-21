import { useState } from "react";
import { ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Category from "../../components/Category";
import HeroSlider from "../../components/HeroSlider";
import Navbar from "../../components/Navbar";
import ProductList from "../../components/ProductCard";
import SearchAndDelivery from "../../components/SearchAndDelivery";

const Index = () => {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={["top", "bottom"]}>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />

            {/* Navbar wrapper directly flush with status bar and top elements */}
            <View className="bg-white z-50">
                <Navbar />
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingBottom: 40,
                }}
            >
                <SearchAndDelivery onSearch={setSearchQuery} />

                <View className="bg-white">
                    <HeroSlider />
                </View>

                <View className="border-b border-[#DBEAFE] bg-white py-3 shadow-sm">
                    <Category
                        selectedCategory={selectedCategory}
                        onSelectCategory={setSelectedCategory}
                    />
                </View>

                <View className="mt-2 bg-white">
                    <ProductList
                        selectedCategory={selectedCategory}
                        searchQuery={searchQuery}
                        title={
                            searchQuery.trim()
                                ? "Search Results"
                                : selectedCategory === "All"
                                  ? "Hot Menu"
                                  : selectedCategory
                        }
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Index;