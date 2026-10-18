import { useEffect, useRef, useState } from "react";
import { ImageBackground, ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";

const slides = [
  {
    id: "1",
    title: "Delicious Food, Delivered Fast",
    description: "Your favorite meals, delivered right to your door.",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200",
    buttonText: "Explore Food",
  },
  {
    id: "2",
    title: "Discover Your Next Favorite",
    description: "Explore delicious meals from restaurants near you.",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200",
    buttonText: "Discover More",
  },
  {
    id: "3",
    title: "Great Food, Great Moments",
    description: "Make every meal special with BiteFlow.",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200",
    buttonText: "Order Now",
  },
];

const HeroSlider = () => {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (activeIndex + 1) % slides.length;
      scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
      setActiveIndex(nextIndex);
    }, 4000);

    return () => clearInterval(timer);
  }, [activeIndex, width]);

  const handleScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    if (index !== activeIndex && index >= 0 && index < slides.length) {
      setActiveIndex(index);
    }
  };

  return (
    <View>
      <ScrollView ref={scrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={handleScroll}>
        {slides.map((slide) => (
          <ImageBackground key={slide.id} source={{ uri: slide.image }} resizeMode="cover" style={{ width, height: 230 }} className="justify-end overflow-hidden">
            <View className="absolute inset-0 bg-black/45" />
            <View className="px-6 pb-7">
              <Text className="text-2xl font-bold text-white">{slide.title}</Text>
              <Text className="mt-2 text-sm text-gray-100">{slide.description}</Text>
              <TouchableOpacity className="mt-4 self-start rounded-lg bg-blue-600 px-5 py-3">
                <Text className="font-semibold text-white">{slide.buttonText}</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        ))}
      </ScrollView>

      <View className="mt-3 flex-row justify-center gap-2">
        {slides.map((slide, index) => (
          <View key={slide.id} className={`h-2 rounded-full ${index === activeIndex ? "w-6 bg-blue-600" : "w-2 bg-gray-300"}`} />
        ))}
      </View>
    </View>
  );
};

export default HeroSlider;