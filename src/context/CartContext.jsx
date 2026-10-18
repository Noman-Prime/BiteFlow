import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

const CART_STORAGE_KEY = "biteflow_cart";

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [isCartLoaded, setIsCartLoaded] = useState(false);

    useEffect(() => {
        const loadCart = async () => {
            try {
                const savedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);

                if (savedCart) {
                    setCartItems(JSON.parse(savedCart));
                }
            } catch (error) {
                console.log("Load cart error:", error);
            } finally {
                setIsCartLoaded(true);
            }
        };

        loadCart();
    }, []);

    useEffect(() => {
        if (!isCartLoaded) return;

        const saveCart = async () => {
            try {
                await AsyncStorage.setItem(
                    CART_STORAGE_KEY,
                    JSON.stringify(cartItems)
                );
            } catch (error) {
                console.log("Save cart error:", error);
            }
        };

        saveCart();
    }, [cartItems, isCartLoaded]);

    const addToCart = (product) => {
        const productId = product?._id || product?.id;

        if (!productId) {
            console.log("Cannot add product without an ID.");
            return;
        }

        const item = {
            id: String(productId),
            menuItem: String(productId),
            name: product.name,
            price: Number(product.price) || 0,
            image:
                typeof product.image === "string"
                    ? product.image
                    : product.image?.url ||
                      product.image?.secure_url ||
                      "",
            quantity: 1,
        };

        setCartItems((previousItems) => {
            const existingItem = previousItems.find(
                (cartItem) => cartItem.id === item.id
            );

            if (existingItem) {
                return previousItems.map((cartItem) =>
                    cartItem.id === item.id
                        ? {
                              ...cartItem,
                              quantity: cartItem.quantity + 1,
                          }
                        : cartItem
                );
            }

            return [...previousItems, item];
        });
    };

    const updateQuantity = (id, delta) => {
        setCartItems((previousItems) =>
            previousItems
                .map((item) =>
                    item.id === String(id)
                        ? {
                              ...item,
                              quantity: item.quantity + delta,
                          }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    };

    const removeFromCart = (id) => {
        setCartItems((previousItems) =>
            previousItems.filter((item) => item.id !== String(id))
        );
    };

    const clearCart = async () => {
        setCartItems([]);
        await AsyncStorage.removeItem(CART_STORAGE_KEY);
    };

    const itemCount = cartItems.reduce(
        (total, item) => total + item.quantity,
        0
    );

    const subtotal = cartItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    return (
        <CartContext.Provider
            value={{
                cartItems,
                isCartLoaded,
                itemCount,
                subtotal,
                addToCart,
                updateQuantity,
                removeFromCart,
                clearCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error("useCart must be used inside CartProvider");
    }

    return context;
};
