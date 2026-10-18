import { useState } from "react";
import { Platform, ScrollView, StatusBar, View } from "react-native";
import Category from "../../components/Category";
import HeroSlider from "../../components/HeroSlider";
import Navbar from "../../components/Navbar";
import ProductList from "../../components/ProductCard";
import SearchAndDelivery from "../../components/SearchAndDelivery";

const Index = () => {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    const statusBarHeight =
        Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <View
                className="absolute left-0 right-0 top-0 z-50 bg-white shadow-sm"
                style={{ paddingTop: statusBarHeight }}
            >
                <Navbar />
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingTop: statusBarHeight + 60,
                    paddingBottom: 40,
                }}
            >
                <SearchAndDelivery onSearch={setSearchQuery} />

                <View className="-mt-2 bg-white">
                    <HeroSlider />
                </View>

                <View className="border-b border-gray-100 bg-white py-3 shadow-sm">
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
        </View>
    );
};

export default Index;
