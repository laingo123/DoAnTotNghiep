// Polyfill setImmediate for web (required by react-native-root-toast)
if (typeof globalThis.setImmediate === 'undefined') {
  // @ts-ignore
  globalThis.setImmediate = (fn: (...args: any[]) => void, ...args: any[]) => setTimeout(fn, 0, ...args);
}

import "../global.css";
import { CartProvider } from '@/components/CartContext';
import { AuthProvider } from '@/components/AuthContext';
import { LanguageProvider } from '@/components/LanguageContext';
import { ThemeProvider } from '@/components/ThemeContext';
import { FavoritesProvider } from '@/components/FavoritesContext';
import { Stack } from 'expo-router/stack';
import { RootSiblingParent } from 'react-native-root-siblings';
import { useFonts } from "expo-font";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Sora-Regular": require("../assets/fonts/Sora-Regular.ttf"),
    "Sora-SemiBold": require("../assets/fonts/Sora-SemiBold.ttf"),
    "Sora-Bold": require("../assets/fonts/Sora-Bold.ttf"),
  });

  if (!fontsLoaded) {
    return undefined;
  }

  return (
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
          <FavoritesProvider>
          <CartProvider>
            <RootSiblingParent>
              <Stack>
                <Stack.Screen name="index" 
                options={{ headerShown: false }}
                />
                <Stack.Screen name="details" 
                options={{ headerShown: true }}
                />
                <Stack.Screen name="thankyou"
                options={{ headerShown: false }}
                />
                <Stack.Screen name="login"
                options={{ headerShown: false }}
                />
                <Stack.Screen name="payment"
                options={{ headerShown: false }}
                />
                <Stack.Screen name="forgot-password"
                options={{ headerShown: false }}
                />
                <Stack.Screen name="register"
                options={{ headerShown: false }}
                />

                <Stack.Screen name="order-history"
                options={{ headerShown: false }}
                />
                <Stack.Screen name="favorites"
                options={{ headerShown: false }}
                />

                <Stack.Screen name="promotions"
                options={{ headerShown: false }}
                />

                <Stack.Screen name="coffee-explorer"
                options={{ headerShown: false }}
                />

                <Stack.Screen name="news"
                options={{ headerShown: false }}
                />

                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>
            </RootSiblingParent>
          </CartProvider>
          </FavoritesProvider>
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
