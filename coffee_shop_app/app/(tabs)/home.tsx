import { useEffect, useState } from 'react';
import { Product, ProductCategory } from '@/types/types';
import { fetchProducts } from '@/services/productService';
import { Text, View, FlatList, StatusBar, TouchableOpacity, useWindowDimensions } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { router } from "expo-router";
import AntDesign from '@expo/vector-icons/AntDesign';
import Toast from 'react-native-root-toast';
import { useCart } from '@/components/CartContext';
import Banner from '@/components/Banner';
import SearchArea from '@/components/SearchArea';
import { useTheme } from '@/components/ThemeContext';
import { useFavorites } from '@/components/FavoritesContext';
import PageTransition from '@/components/PageTransition';
import { Ionicons } from '@expo/vector-icons';
import VoiceOrderModal from '@/components/VoiceOrderModal';
import ProductImage from '@/components/ProductImage';

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
  const [searchText, setSearchText] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { width: viewportWidth } = useWindowDimensions();
  const pagePadding = viewportWidth >= 900 ? 48 : 16;
  const availableWidth = Math.max(viewportWidth - pagePadding * 2, 280);
  const contentWidth = Math.min(availableWidth, 1320);
  const gridGap = viewportWidth >= 900 ? 18 : 12;
  const minCardWidth = viewportWidth >= 900 ? 200 : 160;
  const columnCount = Math.max(2, Math.min(6, Math.floor((contentWidth + gridGap) / (minCardWidth + gridGap))));
  const cardWidth = (contentWidth - gridGap * (columnCount - 1)) / columnCount;

  const sortProducts = (items: Product[]) => [...items].sort((a, b) => {
    const categoryCompare = a.category.localeCompare(b.category);
    if (categoryCompare !== 0) return categoryCompare;
    return a.name.localeCompare(b.name);
  });

  const formatVND = (usd: number) => {
    const vnd = Math.round(usd * 25000);
    return new Intl.NumberFormat('vi-VN').format(vnd) + 'đ';
  };

  const normalizeSearchValue = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .trim();

  const applyFilters = (allProducts: Product[], category: string, priceIndex: number, keyword: string) => {
    let filtered = allProducts;
    const normalizedKeyword = normalizeSearchValue(keyword);

    if (normalizedKeyword) {
      filtered = filtered.filter((product) =>
        [product.name, product.category, product.description, formatVND(product.price), String(Math.round(product.price * 25000))]
          .filter(Boolean)
          .some((value) => normalizeSearchValue(String(value)).includes(normalizedKeyword))
      );
    }

    if (category !== 'All') {
      filtered = filtered.filter((product) => product.category === category);
    }
    if (priceIndex > 0) {
      const range = PRICE_RANGES[priceIndex];
      filtered = filtered.filter((product) => product.price >= range.min && product.price <= range.max);
    }
    setShownProducts(sortProducts(filtered));
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
      applyFilters(data, selectedCategory, selectedPrice, searchText);
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
    applyFilters(products, selectedCategory, selectedPrice, searchText);
  }, [selectedCategory, selectedPrice, searchText, products]);

  const addButton = (name: string) => {
    addToCart(name, 1);
    Toast.show(`${name} added to cart`, {
      duration: Toast.durations.SHORT,
    });
  };

  const stopWebPropagation = (event: any) => {
    event?.stopPropagation?.();
    event?.preventDefault?.();
    event?.nativeEvent?.stopPropagation?.();
    event?.nativeEvent?.preventDefault?.();
  };

  const handleFavoritePress = (event: any, name: string) => {
    stopWebPropagation(event);
    toggleFavorite(name);
  };

  const handleAddPress = (event: any, name: string) => {
    stopWebPropagation(event);
    addButton(name);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PageTransition>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.headerBg} />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <FlatList
          key={columnCount}
          data={shownProducts}
          keyExtractor={(item) => item.id || item.name}
          numColumns={columnCount}
          columnWrapperStyle={{ width: contentWidth, alignSelf: 'center' }}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 4 }}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => router.push({
                pathname: '/details',
                params: {
                  id: item.id,
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
                borderRadius: 14,
                padding: 10,
                width: cardWidth,
                marginRight: (index + 1) % columnCount === 0 ? 0 : gridGap,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: '#000',
                shadowOpacity: isDark ? 0 : 0.06,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 2,
              }}
            >
              <View style={{ position: 'relative' }}>
                <ProductImage
                  uri={item.image_url}
                  style={{ width: '100%', aspectRatio: 1, borderRadius: 12 }}
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
                  onPress={(event) => handleFavoritePress(event, item.name)}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    borderRadius: 12, padding: 6,
                  }}
                >
                  <Ionicons
                    name={isFavorite(item.name) ? 'heart' : 'heart-outline'}
                    size={13}
                    color={isFavorite(item.name) ? '#FF4757' : 'white'}
                  />
                </TouchableOpacity>
              </View>

              <View style={{ minHeight: 54, marginTop: 10, paddingHorizontal: 2 }}>
                <Text style={{ color: colors.text, fontSize: 14, lineHeight: 19, fontFamily: 'Sora-SemiBold' }} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: 'Sora-Regular', marginTop: 4 }} numberOfLines={1}>
                  {item.category}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingHorizontal: 2 }}>
                <Text style={{ color: colors.text, fontSize: 15, fontFamily: 'Sora-Bold', flex: 1 }} numberOfLines={1}>
                  {formatVND(item.price)}
                </Text>
                <TouchableOpacity onPress={(event) => handleAddPress(event, item.name)}>
                  <View style={{ width: 34, height: 34, backgroundColor: '#C67C4E', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                    <AntDesign name="plus" size={18} color="white" />
                  </View>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          ListHeaderComponent={() => (
            <View style={{ backgroundColor: colors.background }}>
              <SearchArea
                value={searchText}
                onChangeText={setSearchText}
                onClear={() => setSearchText('')}
              />
              <Banner />

              {/* Quick Access: Coffee Explorer */}
              <TouchableOpacity
                onPress={() => router.push('/coffee-explorer')}
                activeOpacity={0.85}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginHorizontal: 0,
                  width: contentWidth,
                  alignSelf: 'center',
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
                  marginHorizontal: 0,
                  width: contentWidth,
                  alignSelf: 'center',
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

              <View style={{ width: contentWidth, alignSelf: 'center', alignItems: 'flex-start' }}>
                {/* Category filter */}
                <FlatList
                  style={{ marginTop: 24, width: '100%', marginBottom: 8 }}
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
                  style={{ width: '100%', marginBottom: 8 }}
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
      <TouchableOpacity
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
      </TouchableOpacity>

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
