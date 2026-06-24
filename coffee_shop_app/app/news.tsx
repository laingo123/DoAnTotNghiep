import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Linking,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { Ionicons, Entypo, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeContext';
import { useLanguage } from '@/components/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import PageTransition from '@/components/PageTransition';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
  withDelay,
  interpolate,
  FadeIn,
  SlideInRight,
} from 'react-native-reanimated';
import {
  fetchWeather,
  fetchCoffeeNews,
  fetchCoffeePrices,
  getDrinkRecommendation,
  WeatherData,
  NewsArticle,
  CoffeePrice,
} from '@/services/externalDataService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ===== WEATHER WIDGET =====
const WeatherWidget = ({ colors, isDark }: { colors: any; isDark: boolean }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const breathe = useSharedValue(0.9);
  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0.9, { duration: 2000 })
      ),
      -1, true
    );
  }, []);

  const breatheStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value }],
  }));

  useEffect(() => {
    loadWeather();
  }, []);

  const loadWeather = async () => {
    setLoading(true);
    const data = await fetchWeather();
    setWeather(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={{
        marginHorizontal: 16, marginTop: 16,
        backgroundColor: colors.card,
        borderRadius: 20, padding: 30,
        alignItems: 'center',
      }}>
        <ActivityIndicator color="#C67C4E" size="small" />
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8, fontFamily: 'Sora-Regular' }}>
          Đang tải thời tiết...
        </Text>
      </View>
    );
  }

  if (!weather) return null;

  const recommendation = getDrinkRecommendation(weather);

  return (
    <View style={{ marginHorizontal: 16, marginTop: 16 }}>
      <LinearGradient
        colors={
          weather.temperature >= 30
            ? (isDark ? ['#7C2D12', '#1C1917'] : ['#FED7AA', '#FDBA74'])
            : weather.temperature >= 20
            ? (isDark ? ['#1E3A5F', '#1A1A2E'] : ['#BFDBFE', '#93C5FD'])
            : (isDark ? ['#1E293B', '#0F172A'] : ['#E0E7FF', '#C7D2FE'])
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 24,
          padding: 20,
          overflow: 'hidden',
        }}
      >
        {/* Decorative */}
        <View style={{
          position: 'absolute', top: -30, right: -20,
          width: 100, height: 100, borderRadius: 50,
          backgroundColor: 'rgba(255,255,255,0.06)',
        }} />

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="location-outline" size={14} color={isDark ? '#94A3B8' : '#64748B'} />
            <Text style={{
              color: isDark ? '#94A3B8' : '#64748B',
              fontSize: 12, fontFamily: 'Sora-Regular', marginLeft: 4,
            }}>
              Đà Nẵng, VN
            </Text>
            <View style={{
              backgroundColor: '#10B981',
              width: 6, height: 6, borderRadius: 3,
              marginLeft: 6,
            }} />
            <Text style={{
              color: '#10B981',
              fontSize: 10, fontFamily: 'Sora-Regular', marginLeft: 3,
            }}>
              LIVE
            </Text>
          </View>
          <TouchableOpacity onPress={loadWeather}>
            <Ionicons name="refresh-outline" size={18} color={isDark ? '#94A3B8' : '#64748B'} />
          </TouchableOpacity>
        </View>

        {/* Weather Info */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
          <Animated.View style={breatheStyle}>
            <Text style={{ fontSize: 56 }}>{weather.icon}</Text>
          </Animated.View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={{
              color: isDark ? '#F1F5F9' : '#1E293B',
              fontSize: 42, fontFamily: 'Sora-Bold', lineHeight: 48,
            }}>
              {weather.temperature}°C
            </Text>
            <Text style={{
              color: isDark ? '#94A3B8' : '#64748B',
              fontSize: 14, fontFamily: 'Sora-Regular',
            }}>
              {weather.description} • Gió {weather.windSpeed} km/h
            </Text>
          </View>
        </View>

        {/* Drink Recommendation */}
        <View style={{
          marginTop: 16,
          backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
          borderRadius: 16,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <View style={{
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: recommendation.color + '20',
            alignItems: 'center', justifyContent: 'center',
            marginRight: 12,
          }}>
            <Text style={{ fontSize: 22 }}>{recommendation.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: isDark ? '#E2E8F0' : '#1E293B',
              fontSize: 14, fontFamily: 'Sora-SemiBold',
            }}>
              Gợi ý: {recommendation.drink}
            </Text>
            <Text style={{
              color: isDark ? '#94A3B8' : '#64748B',
              fontSize: 11, fontFamily: 'Sora-Regular', marginTop: 2, lineHeight: 16,
            }}>
              {recommendation.description}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/home')}
            style={{
              backgroundColor: recommendation.color,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Ionicons name="cafe" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

// ===== MARKET PRICES =====
const MarketPrices = ({ colors, isDark }: { colors: any; isDark: boolean }) => {
  const [prices, setPrices] = useState<CoffeePrice[]>([]);
  const [loading, setLoading] = useState(true);

  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1, true
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  useEffect(() => {
    loadPrices();
  }, []);

  const loadPrices = async () => {
    setLoading(true);
    const data = await fetchCoffeePrices();
    setPrices(data);
    setLoading(false);
  };

  return (
    <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 20, marginRight: 8 }}>📈</Text>
          <Text style={{ fontSize: 18, fontFamily: 'Sora-Bold', color: colors.text }}>
            Giá cà phê thế giới
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Animated.View style={[{
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: '#10B981', marginRight: 6,
          }, pulseStyle]} />
          <Text style={{ color: '#10B981', fontSize: 11, fontFamily: 'Sora-SemiBold' }}>
            Realtime
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={{
          backgroundColor: colors.card,
          borderRadius: 16, padding: 30,
          alignItems: 'center',
        }}>
          <ActivityIndicator color="#C67C4E" size="small" />
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8, fontFamily: 'Sora-Regular' }}>
            Đang tải giá thị trường...
          </Text>
        </View>
      ) : (
        <View style={{
          backgroundColor: colors.card,
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: isDark ? '#333' : '#F0F0F0',
        }}>
          {/* Table Header */}
          <View style={{
            flexDirection: 'row',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: isDark ? '#1E1E1E' : '#F8F8F8',
            borderBottomWidth: 1,
            borderBottomColor: isDark ? '#333' : '#F0F0F0',
          }}>
            <Text style={{ flex: 2.5, color: colors.textSecondary, fontSize: 11, fontFamily: 'Sora-SemiBold' }}>
              Loại
            </Text>
            <Text style={{ flex: 1.5, color: colors.textSecondary, fontSize: 11, fontFamily: 'Sora-SemiBold', textAlign: 'right' }}>
              Giá
            </Text>
            <Text style={{ flex: 1.5, color: colors.textSecondary, fontSize: 11, fontFamily: 'Sora-SemiBold', textAlign: 'right' }}>
              Thay đổi
            </Text>
          </View>

          {/* Price Rows */}
          {prices.map((price, index) => {
            const isPositive = price.change >= 0;
            return (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: index < prices.length - 1 ? 1 : 0,
                  borderBottomColor: isDark ? '#2A2A2A' : '#F5F5F5',
                  alignItems: 'center',
                }}
              >
                <View style={{ flex: 2.5, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, marginRight: 8 }}>{price.flag}</Text>
                  <Text style={{ color: colors.text, fontSize: 13, fontFamily: 'Sora-SemiBold' }}>
                    {price.type}
                  </Text>
                </View>
                <Text style={{
                  flex: 1.5,
                  color: colors.text,
                  fontSize: 14,
                  fontFamily: 'Sora-Bold',
                  textAlign: 'right',
                }}>
                  {price.price.toLocaleString('vi-VN')}
                </Text>
                <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isPositive ? '#10B98115' : '#EF444415',
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  }}>
                    <Ionicons
                      name={isPositive ? 'trending-up' : 'trending-down'}
                      size={12}
                      color={isPositive ? '#10B981' : '#EF4444'}
                    />
                    <Text style={{
                      color: isPositive ? '#10B981' : '#EF4444',
                      fontSize: 12,
                      fontFamily: 'Sora-Bold',
                      marginLeft: 3,
                    }}>
                      {isPositive ? '+' : ''}{price.changePercent}%
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}

          {/* Footer */}
          <View style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: isDark ? '#1E1E1E' : '#F8F8F8',
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}>
            <Text style={{ color: colors.textSecondary, fontSize: 10, fontFamily: 'Sora-Regular' }}>
              Cập nhật: {new Date().toLocaleTimeString('vi-VN')}
            </Text>
            <TouchableOpacity onPress={loadPrices}>
              <Text style={{ color: '#C67C4E', fontSize: 10, fontFamily: 'Sora-SemiBold' }}>
                ↻ Làm mới
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

// ===== NEWS FEED =====
const NewsFeed = ({ colors, isDark }: { colors: any; isDark: boolean }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    const data = await fetchCoffeeNews();
    setArticles(data);
    setLoading(false);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);

      if (hours < 1) return 'Vừa xong';
      if (hours < 24) return `${hours} giờ trước`;
      if (days < 7) return `${days} ngày trước`;
      return date.toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  const openArticle = (url: string) => {
    if (url) Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={{
        marginHorizontal: 16, marginTop: 24,
        backgroundColor: colors.card,
        borderRadius: 16, padding: 30,
        alignItems: 'center',
      }}>
        <ActivityIndicator color="#C67C4E" size="small" />
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8, fontFamily: 'Sora-Regular' }}>
          Đang tải tin tức cà phê...
        </Text>
      </View>
    );
  }

  if (articles.length === 0) {
    return (
      <View style={{
        marginHorizontal: 16, marginTop: 24,
        backgroundColor: colors.card,
        borderRadius: 16, padding: 30,
        alignItems: 'center',
      }}>
        <Text style={{ fontSize: 36, marginBottom: 8 }}>📰</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, fontFamily: 'Sora-Regular' }}>
          Không tải được tin tức lúc này
        </Text>
        <TouchableOpacity
          onPress={loadNews}
          style={{
            marginTop: 12,
            backgroundColor: '#C67C4E',
            borderRadius: 10,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: '#FFF', fontSize: 13, fontFamily: 'Sora-SemiBold' }}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // First article = hero
  const heroArticle = articles[0];
  const restArticles = articles.slice(1, 8);

  return (
    <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 20, marginRight: 8 }}>📰</Text>
          <Text style={{ fontSize: 18, fontFamily: 'Sora-Bold', color: colors.text }}>
            Tin tức cà phê
          </Text>
        </View>
        <View style={{
          backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0',
          borderRadius: 10,
          paddingHorizontal: 10,
          paddingVertical: 3,
        }}>
          <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: 'Sora-Regular' }}>
            {articles[0]?.source || 'Coffee News'}
          </Text>
        </View>
      </View>

      {/* Hero Article */}
      <TouchableOpacity
        onPress={() => openArticle(heroArticle.link)}
        activeOpacity={0.85}
        style={{
          backgroundColor: colors.card,
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 14,
          borderWidth: 1,
          borderColor: isDark ? '#333' : '#F0F0F0',
        }}
      >
        {heroArticle.thumbnail ? (
          <Image
            source={{ uri: heroArticle.thumbnail }}
            style={{ width: '100%', height: 180 }}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={isDark ? ['#2A2A2A', '#1A1A1A'] : ['#FFF8F0', '#FFE8D0']}
            style={{
              width: '100%',
              height: 120,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 48 }}>☕</Text>
          </LinearGradient>
        )}
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View style={{
              backgroundColor: '#C67C4E',
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}>
              <Text style={{ color: '#FFF', fontSize: 10, fontFamily: 'Sora-Bold' }}>MỚI NHẤT</Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 11, marginLeft: 8, fontFamily: 'Sora-Regular' }}>
              {formatDate(heroArticle.pubDate)}
            </Text>
          </View>
          <Text style={{
            color: colors.text,
            fontSize: 17,
            fontFamily: 'Sora-Bold',
            lineHeight: 24,
            marginBottom: 6,
          }}>
            {heroArticle.title}
          </Text>
          <Text style={{
            color: colors.textSecondary,
            fontSize: 13,
            fontFamily: 'Sora-Regular',
            lineHeight: 20,
          }} numberOfLines={3}>
            {heroArticle.description}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
            <Text style={{ color: '#C67C4E', fontSize: 13, fontFamily: 'Sora-SemiBold' }}>
              Đọc thêm
            </Text>
            <Ionicons name="arrow-forward" size={14} color="#C67C4E" style={{ marginLeft: 4 }} />
          </View>
        </View>
      </TouchableOpacity>

      {/* Rest Articles */}
      {restArticles.map((article, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => openArticle(article.link)}
          activeOpacity={0.85}
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            marginBottom: 10,
            flexDirection: 'row',
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: isDark ? '#2A2A2A' : '#F0F0F0',
          }}
        >
          {/* Thumbnail */}
          {article.thumbnail ? (
            <Image
              source={{ uri: article.thumbnail }}
              style={{ width: 100, height: 100 }}
              resizeMode="cover"
            />
          ) : (
            <View style={{
              width: 100, height: 100,
              backgroundColor: isDark ? '#2A2A2A' : '#FFF8F0',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 30 }}>☕</Text>
            </View>
          )}

          {/* Content */}
          <View style={{ flex: 1, padding: 12, justifyContent: 'center' }}>
            <Text style={{
              color: colors.text,
              fontSize: 14,
              fontFamily: 'Sora-SemiBold',
              lineHeight: 20,
              marginBottom: 6,
            }} numberOfLines={2}>
              {article.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
              <Text style={{
                color: colors.textSecondary,
                fontSize: 11,
                fontFamily: 'Sora-Regular',
                marginLeft: 4,
              }}>
                {formatDate(article.pubDate)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        onPress={loadNews}
        style={{
          alignItems: 'center',
          paddingVertical: 12,
          marginTop: 4,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="refresh" size={14} color="#C67C4E" />
          <Text style={{ color: '#C67C4E', fontSize: 13, fontFamily: 'Sora-SemiBold', marginLeft: 6 }}>
            Tải thêm tin tức
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

// ===== MAIN PAGE =====
export default function NewsPage() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [key, setKey] = useState(0);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setKey(prev => prev + 1); // Force re-render all children
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Animated header
  const headerScale = useSharedValue(0.95);
  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    headerScale.value = withTiming(1, { duration: 500 });
    headerOpacity.value = withTiming(1, { duration: 500 });
  }, []);

  const headerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
    opacity: headerOpacity.value,
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PageTransition>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>

        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Entypo name="chevron-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontFamily: 'Sora-SemiBold', color: colors.text }}>
              📡 Tin tức & Cập nhật
            </Text>
          </View>
          <TouchableOpacity onPress={onRefresh} style={{ padding: 4 }}>
            <Ionicons name="refresh-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          key={key}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#C67C4E"
              colors={['#C67C4E']}
            />
          }
        >
          {/* Top Banner */}
          <Animated.View style={headerAnimStyle}>
            <LinearGradient
              colors={isDark ? ['#1A1A2E', '#16213E'] : ['#0F172A', '#1E293B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                marginHorizontal: 16,
                marginTop: 16,
                borderRadius: 20,
                padding: 20,
                flexDirection: 'row',
                alignItems: 'center',
                overflow: 'hidden',
              }}
            >
              <View style={{
                position: 'absolute', top: -20, right: -20,
                width: 100, height: 100, borderRadius: 50,
                backgroundColor: 'rgba(198,124,78,0.1)',
              }} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <View style={{
                    backgroundColor: '#10B981',
                    width: 8, height: 8, borderRadius: 4,
                    marginRight: 6,
                  }} />
                  <Text style={{ color: '#10B981', fontSize: 11, fontFamily: 'Sora-SemiBold' }}>
                    DỮ LIỆU TRỰC TIẾP
                  </Text>
                </View>
                <Text style={{
                  color: '#FFF',
                  fontSize: 20,
                  fontFamily: 'Sora-Bold',
                  marginBottom: 4,
                }}>
                  Cập nhật realtime
                </Text>
                <Text style={{
                  color: '#94A3B8',
                  fontSize: 12,
                  fontFamily: 'Sora-Regular',
                  lineHeight: 18,
                }}>
                  Thời tiết, giá cà phê, và tin tức mới nhất từ nguồn uy tín
                </Text>
              </View>
              <View style={{
                width: 56, height: 56, borderRadius: 28,
                backgroundColor: 'rgba(198,124,78,0.2)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 28 }}>📡</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Weather Widget - Real Data */}
          <WeatherWidget colors={colors} isDark={isDark} />

          {/* Market Prices - Real Data */}
          <MarketPrices colors={colors} isDark={isDark} />

          {/* News Feed - Real Data */}
          <NewsFeed colors={colors} isDark={isDark} />

        </ScrollView>
      </SafeAreaView>
      </PageTransition>
    </GestureHandlerRootView>
  );
}
