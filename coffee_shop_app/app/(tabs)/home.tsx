import { useEffect, useState } from 'react';
import { Product, ProductCategory } from '@/types/types';
import { fetchProducts } from '@/services/productService';
import { Text, View, Image, FlatList, StatusBar } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { GestureHandlerRootView, TouchableOpacity } from "react-native-gesture-handler";
import { router } from "expo-router";
import AntDesign from '@expo/vector-icons/AntDesign';
import Toast from 'react-native-root-toast';
import { useCart } from '@/components/CartContext';
import Banner from '@/components/Banner';
import SearchArea from '@/components/SearchArea';
import { useTheme } from '@/components/ThemeContext';
import { useFavorites } from '@/components/FavoritesContext';
import { TouchableOpacity as RNTouchable } from 'react-native';
import PageTransition from '@/components/PageTransition';
import { Ionicons } from '@expo/vector-icons';
import VoiceOrderModal from '@/components/VoiceOrderModal';

const PRICE_RANGES = [
  { label: 'Tất cả', min: 0, max: 999 },
  { label: '< $2', min: 0, max: 1.99 },
  { label: '$2-$3', min: 2, max: 3 },
  { label: '$3-$4', min: 3, max: 4 },
  { label: '$4-$5', min: 4, max: 5 },
  { label: '> $5', min: 5.01, max: 999 },
];

const Home = () => {
  const { addToCart } = useCart();
  const { colors, isDark } = useTheme();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [voiceOrderVisible, setVoiceOrderVisible] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [shownProducts, setShownProducts] = useState<Product[]>([]);
  const [productCategories, setProductCatgories] = useState<ProductCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPrice, setSelectedPrice] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const applyFilters = (allProducts: Product[], category: string, priceIndex: number) => {
    let filtered = allProducts;
    if (category !== 'All') {
      filtered = filtered.filter((product) => product.category === category);
    }
    if (priceIndex > 0) {
      const range = PRICE_RANGES[priceIndex];
      filtered = filtered.filter((product) => product.price >= range.min && product.price <= range.max);
    }
    setShownProducts(filtered);
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data);
      setShownProducts(data);

      const categories = data.map((product) => product.category);
      const uniqueCats = Array.from(new Set(categories));
      uniqueCats.unshift('All');
      setProductCatgories(uniqueCats.map((cat) => ({
        id: cat,
        selected: cat === selectedCategory,
      })));
      applyFilters(data, selectedCategory, selectedPrice);
      setError(null);
    } catch (err: any) {
      setError("Error fetching products: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    setProductCatgories((prev) => prev.map((category) => ({
      id: category.id,
      selected: selectedCategory === category.id,
    })));
    applyFilters(products, selectedCategory, selectedPrice);
  }, [selectedCategory, selectedPrice, products]);

  const addButton = (name: string) => {
    addToCart(name, 1);
    Toast.show(`${name} added to cart`, {
      duration: Toast.durations.SHORT,
    });
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PageTransition>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.headerBg} />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <FlatList
          data={shownProducts}
          keyExtractor={(item, index) => index.toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push({
                pathname: '/details',
                params: {
                  name: item.name,
                  image_url: item.image_url,
                  type: item.category,
                  description: item.description,
                  price: item.price.toString(),
                  rating: item.rating.toString()
                }
              })}
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 8,
                width: '48%',
                marginBottom: 16,
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <View style={{ position: 'relative' }}>
                <Image
                  source={{ uri: item.image_url }}
                  style={{ width: '100%', height: 132, borderRadius: 12 }}
                />
                <View style={{
                  position: 'absolute', top: 8, left: 8,
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12,
                  paddingHorizontal: 8, paddingVertical: 2
                }}>
                  <AntDesign name="star" size={10} color="#FFB800" />
                  <Text style={{ color: 'white', fontSize: 10, fontFamily: 'Sora-Bold', marginLeft: 4 }}>
                    {item.rating}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => toggleFavorite(item.name)}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    borderRadius: 12, padding: 6,
                  }}
                >
                  <AntDesign
                    name={isFavorite(item.name) ? 'heart' : 'hearto'}
                    size={14}
                    color={isFavorite(item.name) ? '#FF4757' : 'white'}
                  />
                </TouchableOpacity>
              </View>

              <Text style={{ color: colors.text, fontSize: 16, fontFamily: 'Sora-SemiBold', marginTop: 12, marginLeft: 4 }} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: 'Sora-Regular', marginTop: 2, marginLeft: 4 }}>
                {item.category}
              </Text>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginLeft: 4, marginTop: 16, marginBottom: 8 }}>
                <Text style={{ color: colors.text, fontSize: 20, fontFamily: 'Sora-SemiBold' }}>
                  ${item.price}
                </Text>
                <TouchableOpacity onPress={() => addButton(item.name)}>
                  <View style={{ marginRight: 8, padding: 8, marginTop: -4, backgroundColor: '#C67C4E', borderRadius: 12 }}>
                    <AntDesign name="plus" size={20} color="white" />
                  </View>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          ListHeaderComponent={() => (
            <View style={{ backgroundColor: colors.background }}>
              <SearchArea />
              <Banner />

              {/* Quick Access: Coffee Explorer */}
              <TouchableOpacity
                onPress={() => router.push('/coffee-explorer')}
                activeOpacity={0.85}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginHorizontal: 20,
                  marginTop: 14,
                  backgroundColor: isDark ? '#2A1F3A' : '#F3EEFF',
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: isDark ? '#3A2F4A' : '#E0D4FF',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, marginRight: 10 }}>☕</Text>
                  <View>
                    <Text style={{ color: isDark ? '#DDD' : '#4A3370', fontSize: 13, fontFamily: 'Sora-SemiBold' }}>
                      Khám phá cà phê
                    </Text>
                    <Text style={{ color: isDark ? '#999' : '#8B7AAF', fontSize: 11, fontFamily: 'Sora-Regular' }}>
                      Mood gợi ý • Vòng quay • Origins
                    </Text>
                  </View>
                </View>
                <View style={{
                  backgroundColor: '#8B5CF6',
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}>
                  <Text style={{ color: '#FFF', fontSize: 11, fontFamily: 'Sora-Bold' }}>NEW</Text>
                </View>
              </TouchableOpacity>

              {/* Quick Access: News & Updates */}
              <TouchableOpacity
                onPress={() => router.push('/news')}
                activeOpacity={0.85}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginHorizontal: 20,
                  marginTop: 10,
                  backgroundColor: isDark ? '#1F3A30' : '#EEFAF4',
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: isDark ? '#2F4A3E' : '#D4F0E2',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, marginRight: 10 }}>📡</Text>
                  <View>
                    <Text style={{ color: isDark ? '#DDD' : '#1E5E42', fontSize: 13, fontFamily: 'Sora-SemiBold' }}>
                      Tin tức & Cập nhật
                    </Text>
                    <Text style={{ color: isDark ? '#999' : '#5F8F79', fontSize: 11, fontFamily: 'Sora-Regular' }}>
                      Thời tiết • Giá cà phê • Tin tức Live
                    </Text>
                  </View>
                </View>
                <View style={{
                  backgroundColor: '#10B981',
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}>
                  <Text style={{ color: '#FFF', fontSize: 11, fontFamily: 'Sora-Bold' }}>LIVE</Text>
                </View>
              </TouchableOpacity>

              <View style={{ alignItems: 'center' }}>
                {/* Category filter */}
                <FlatList
                  style={{ marginTop: 24, width: '90%', marginBottom: 8 }}
                  data={productCategories}
                  horizontal={true}
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => setSelectedCategory(item.id)}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          marginRight: 16,
                          fontFamily: 'Sora-Regular',
                          padding: 12,
                          borderRadius: 8,
                          overflow: 'hidden',
                          color: item.selected ? '#FFF' : colors.text,
                          backgroundColor: item.selected ? '#C67C4E' : (isDark ? '#333' : '#EDEDED'),
                        }}
                      >
                        {item.id}
                      </Text>
                    </TouchableOpacity>
                  )}
                />

                {/* Price filter */}
                <FlatList
                  style={{ width: '90%', marginBottom: 8 }}
                  data={PRICE_RANGES}
                  horizontal={true}
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      onPress={() => setSelectedPrice(index)}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          marginRight: 12,
                          fontFamily: 'Sora-Regular',
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 20,
                          overflow: 'hidden',
                          color: selectedPrice === index ? '#FFF' : colors.textSecondary,
                          backgroundColor: selectedPrice === index ? '#C67C4E' : colors.card,
                          borderWidth: selectedPrice === index ? 0 : 1,
                          borderColor: colors.border,
                        }}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={{ alignItems: 'center', paddingVertical: 80 }}>
              <AntDesign name="inbox" size={48} color="#ccc" />
              <Text style={{ color: colors.textSecondary, marginTop: 16, fontSize: 16, fontFamily: 'Sora-Regular' }}>
                {loading ? 'Đang tải sản phẩm...' : 'Không tìm thấy sản phẩm'}
              </Text>
            </View>
          )}
        />
      </SafeAreaView>
      </PageTransition>

      {/* Floating Voice Order FAB */}
      <RNTouchable
        onPress={() => setVoiceOrderVisible(true)}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#FFFFFF',
          borderWidth: 1.5,
          borderColor: '#C67C4E',
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 6,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 4 },
          zIndex: 999,
        }}
      >
        <Ionicons name="mic" size={26} color="#C67C4E" />
      </RNTouchable>

      {/* Voice Assistant Modal */}
      <VoiceOrderModal
        visible={voiceOrderVisible}
        onClose={() => setVoiceOrderVisible(false)}
        products={products}
      />
    </GestureHandlerRootView>
  );
};

export default Home;
