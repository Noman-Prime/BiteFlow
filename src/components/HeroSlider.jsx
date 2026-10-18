import { useEffect, useRef, useState } from "react";
import { ImageBackground, ScrollView, Text, View, useWindowDimensions } from "react-native";

import burgerImage from "../../assets/burger.jpg";
import pizzaImage from "../../assets/pizza.jpg";
import sweetImage from "../../assets/sweet.jpg";
import tableImage from "../../assets/table.jpg";

const slides = [
  {
    id: "1",
    title: "Delicious Food, Delivered Fast",
    description: "Your favorite meals, delivered right to your door.",
    image: burgerImage,
  },
  {
    id: "2",
    title: "Discover Your Next Favorite",
    description: "Explore delicious meals from restaurants near you.",
    image: pizzaImage,
  },
  {
    id: "3",
    title: "Great Food, Great Moments",
    description: "Make every meal special with BiteFlow.",
    image: sweetImage,
  },
  {
    id: "4",
    title: "Reserve Your Table",
    description: "Book your table in advance and enjoy a seamless dining experience.",
    image: tableImage,
  }
];

const HeroSlider = () => {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % slides.length;
        scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [width]);

  const handleScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    if (index !== activeIndex && index >= 0 && index < slides.length) {
      setActiveIndex(index);
    }
  };

  return (
    <View className="w-full">
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
      >
        {slides.map((slide) => (
          <ImageBackground
            key={slide.id}
            source={slide.image}
            resizeMode="cover"
            style={{ width, height: 210 }}
            className="justify-end overflow-hidden"
          >
            <View className="absolute inset-0 bg-black/50" />
            <View className="px-6 pb-6">
              <Text className="text-2xl font-bold text-white">{slide.title}</Text>
              <Text className="mt-1.5 text-sm text-gray-200">{slide.description}</Text>
            </View>
          </ImageBackground>
        ))}
      </ScrollView>

      <View className="mt-3 flex-row justify-center items-center gap-2">
        {slides.map((slide, index) => (
          <View
            key={slide.id}
            className={`h-2 rounded-full ${index === activeIndex ? "w-6 bg-blue-600" : "w-2 bg-slate-600"}`}
          />
        ))}
      </View>
    </View>
  );
};

export default HeroSlider;