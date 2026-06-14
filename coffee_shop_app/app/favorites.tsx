import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { AntDesign, Entypo } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeContext';
import { useFavorites } from '@/components/FavoritesContext';
import { useCart } from '@/components/CartContext';
import { fetchProducts } from '@/services/productService';
import { Product } from '@/types/types';
import Toast from 'react-native-root-toast';
import PageTransition from '@/components/PageTransition';

export default function Favorites() {
  const router = useRouter();
  const { colors } = useTheme();
  const { favorites, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchProducts().then(setProducts).catch(console.error);
  }, []);

  const favProducts = products.filter(p => favorites.includes(p.name));

  const addButton = (name: string) => {
    addToCart(name, 1);
    Toast.show(`${name} added to cart`, { duration: Toast.durations.SHORT });
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PageTransition>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.surface} />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 16, paddingVertical: 14,
          backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
        }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Entypo name="chevron-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontFamily: 'Sora-SemiBold', color: colors.text }}>
            Yêu thích ({favProducts.length})
          </Text>
          <View style={{ width: 32 }} />
        </View>

        {favProducts.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <AntDesign name="hearto" size={64} color={colors.border} />
            <Text style={{ color: colors.textSecondary, fontSize: 16, marginTop: 16, fontFamily: 'Sora-Regular' }}>
              Chưa có sản phẩm yêu thích
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/home')}
              style={{ backgroundColor: '#C67C4E', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 16 }}
            >
              <Text style={{ color: '#FFF', fontFamily: 'Sora-SemiBold', fontSize: 14 }}>Khám phá ngay</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={favProducts}
            keyExtractor={(item) => item.name}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push({
                  pathname: '/details', params: {
                    name: item.name, image_url: item.image_url,
                    type: item.category, price: item.price,
                    rating: item.rating, description: item.description,
                  }
                })}
                style={{
                  flexDirection: 'row', backgroundColor: colors.card,
                  marginHorizontal: 16, marginBottom: 10, borderRadius: 16, padding: 12,
                  shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
                }}
              >
                <Image
                  source={{ uri: item.image_url }}
                  style={{ width: 80, height: 80, borderRadius: 12 }}
                />
                <View style={{ flex: 1, marginLeft: 14, justifyContent: 'center' }}>
                  <Text style={{ color: colors.text, fontSize: 16, fontFamily: 'Sora-SemiBold' }}>
                    {item.name}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Sora-Regular', marginTop: 2 }}>
                    {item.category}
                  </Text>
                  <Text style={{ color: '#C67C4E', fontSize: 16, fontFamily: 'Sora-SemiBold', marginTop: 4 }}>
                    ${item.price}
                  </Text>
                </View>

                <View style={{ justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
                  <TouchableOpacity onPress={() => toggleFavorite(item.name)} style={{ padding: 4 }}>
                    <AntDesign name="heart" size={20} color="#FF4757" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => addButton(item.name)}
                    style={{ backgroundColor: '#C67C4E', borderRadius: 10, padding: 6 }}
                  >
                    <AntDesign name="plus" size={18} color="white" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
      </PageTransition>
    </GestureHandlerRootView>
  );
}
