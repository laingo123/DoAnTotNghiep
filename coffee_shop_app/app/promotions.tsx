import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { Ionicons, Entypo, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
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
  Easing,
  withDelay,
  interpolate,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ===== PROMO DATA =====
const FLASH_DEALS = [
  {
    id: '1',
    title: 'Mua 1 Tặng 1',
    subtitle: 'Áp dụng tất cả Cappuccino',
    discount: '50%',
    originalPrice: '$4.50',
    salePrice: '$2.25',
    emoji: '☕',
    gradient: ['#FF6B35', '#FF8E53'] as const,
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3h from now
  },
  {
    id: '2',
    title: 'Happy Hour',
    subtitle: 'Giảm giá toàn menu từ 14h-16h',
    discount: '30%',
    originalPrice: '$5.00',
    salePrice: '$3.50',
    emoji: '🎉',
    gradient: ['#667EEA', '#764BA2'] as const,
    endTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
  },
  {
    id: '3',
    title: 'Combo Tiết Kiệm',
    subtitle: '1 Latte + 1 Bánh Croissant',
    discount: '25%',
    originalPrice: '$8.00',
    salePrice: '$6.00',
    emoji: '🥐',
    gradient: ['#F093FB', '#F5576C'] as const,
    endTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
  },
];

const VOUCHERS = [
  {
    id: 'v1',
    code: 'NEWUSER',
    title: 'Giảm 20% đơn đầu tiên',
    description: 'Áp dụng cho khách hàng mới',
    minOrder: '$3.00',
    maxDiscount: '$2.00',
    expiryDate: '30/06/2026',
    color: '#C67C4E',
    icon: 'gift',
  },
  {
    id: 'v2',
    code: 'FREESHIP',
    title: 'Miễn phí giao hàng',
    description: 'Đơn từ $5.00 trở lên',
    minOrder: '$5.00',
    maxDiscount: '$1.50',
    expiryDate: '25/06/2026',
    color: '#10B981',
    icon: 'truck-delivery',
  },
  {
    id: 'v3',
    code: 'SUMMER25',
    title: 'Giảm 25% đồ uống lạnh',
    description: 'Chỉ áp dụng Cold Brew & Frappe',
    minOrder: '$4.00',
    maxDiscount: '$3.00',
    expiryDate: '15/07/2026',
    color: '#3B82F6',
    icon: 'snowflake',
  },
  {
    id: 'v4',
    code: 'WEEKEND',
    title: 'Giảm 15% cuối tuần',
    description: 'Thứ 7 & Chủ nhật hàng tuần',
    minOrder: '$0',
    maxDiscount: '$2.50',
    expiryDate: '31/07/2026',
    color: '#8B5CF6',
    icon: 'calendar-weekend',
  },
];

const SPECIAL_OFFERS = [
  {
    id: 's1',
    title: 'Thẻ thành viên Gold',
    description: 'Tích lũy 500 điểm để nâng hạng, nhận ưu đãi x2',
    icon: 'crown',
    color: '#F59E0B',
    bgGradient: ['#FEF3C7', '#FDE68A'] as const,
  },
  {
    id: 's2',
    title: 'Sinh nhật vui vẻ 🎂',
    description: 'Tặng 1 đồ uống bất kỳ trong tháng sinh nhật',
    icon: 'cake-variant',
    color: '#EC4899',
    bgGradient: ['#FCE7F3', '#FBCFE8'] as const,
  },
  {
    id: 's3',
    title: 'Giới thiệu bạn bè',
    description: 'Mỗi bạn bè đăng ký, cả 2 nhận $1.00 voucher',
    icon: 'account-group',
    color: '#06B6D4',
    bgGradient: ['#CFFAFE', '#A5F3FC'] as const,
  },
];

// ===== COUNTDOWN HOOK =====
const useCountdown = (targetDate: Date) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        hours: Math.floor(distance / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
};

// ===== COUNTDOWN TIMER COMPONENT =====
const CountdownTimer = ({ endTime }: { endTime: Date }) => {
  const { hours, minutes, seconds } = useCountdown(endTime);

  const TimeBox = ({ value, label }: { value: number; label: string }) => (
    <View style={{ alignItems: 'center', marginHorizontal: 3 }}>
      <View style={{
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        minWidth: 36,
        alignItems: 'center',
      }}>
        <Text style={{ color: '#FFF', fontSize: 16, fontFamily: 'Sora-Bold', letterSpacing: 1 }}>
          {value.toString().padStart(2, '0')}
        </Text>
      </View>
      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, marginTop: 2, fontFamily: 'Sora-Regular' }}>
        {label}
      </Text>
    </View>
  );

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <TimeBox value={hours} label="Giờ" />
      <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>:</Text>
      <TimeBox value={minutes} label="Phút" />
      <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>:</Text>
      <TimeBox value={seconds} label="Giây" />
    </View>
  );
};

// ===== FLASH DEAL CARD =====
const FlashDealCard = ({ deal, index }: { deal: typeof FLASH_DEALS[0]; index: number }) => {
  const scale = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    scale.value = withDelay(
      index * 100,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.2)) })
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(scale.value, [0, 1], [0.8, 1]) }],
    opacity: scale.value,
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View style={[{ width: SCREEN_WIDTH * 0.75, marginRight: 14 }, cardStyle]}>
      <LinearGradient
        colors={[...deal.gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 20, padding: 20, minHeight: 180 }}
      >
        {/* Discount Badge */}
        <Animated.View style={[{
          position: 'absolute', top: -8, right: 12,
          backgroundColor: '#FF4757', borderRadius: 14,
          paddingHorizontal: 14, paddingVertical: 6,
          shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
        }, badgeStyle]}>
          <Text style={{ color: '#FFF', fontSize: 18, fontFamily: 'Sora-Bold' }}>
            -{deal.discount}
          </Text>
        </Animated.View>

        {/* Emoji */}
        <Text style={{ fontSize: 40, marginBottom: 8 }}>{deal.emoji}</Text>

        {/* Title */}
        <Text style={{ color: '#FFF', fontSize: 20, fontFamily: 'Sora-Bold', marginBottom: 4 }}>
          {deal.title}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontFamily: 'Sora-Regular', marginBottom: 12 }}>
          {deal.subtitle}
        </Text>

        {/* Price */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{
            color: 'rgba(255,255,255,0.5)', fontSize: 16, fontFamily: 'Sora-Regular',
            textDecorationLine: 'line-through', marginRight: 8,
          }}>
            {deal.originalPrice}
          </Text>
          <Text style={{ color: '#FFF', fontSize: 22, fontFamily: 'Sora-Bold' }}>
            {deal.salePrice}
          </Text>
        </View>

        {/* Countdown */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginLeft: 4, fontFamily: 'Sora-Regular' }}>
              Kết thúc sau
            </Text>
          </View>
          <CountdownTimer endTime={deal.endTime} />
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// ===== VOUCHER CARD =====
const VoucherCard = ({ voucher, index, onCopy }: {
  voucher: typeof VOUCHERS[0];
  index: number;
  onCopy: (code: string) => void;
}) => {
  const { colors, isDark } = useTheme();
  const translateX = useSharedValue(-100);

  useEffect(() => {
    translateX.value = withDelay(
      index * 80,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: interpolate(translateX.value, [-100, 0], [0, 1]),
  }));

  return (
    <Animated.View style={[{
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 16,
      marginBottom: 12,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    }, animStyle]}>
      {/* Left color strip */}
      <View style={{
        width: 6,
        backgroundColor: voucher.color,
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
      }} />

      {/* Left icon section */}
      <View style={{
        width: 70,
        alignItems: 'center',
        justifyContent: 'center',
        borderRightWidth: 1,
        borderRightColor: isDark ? '#333' : '#F0F0F0',
        borderStyle: 'dashed',
      }}>
        <View style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: voucher.color + '18',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <MaterialCommunityIcons name={voucher.icon as any} size={22} color={voucher.color} />
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1, padding: 14 }}>
        <Text style={{ color: colors.text, fontSize: 15, fontFamily: 'Sora-SemiBold', marginBottom: 3 }}>
          {voucher.title}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: 'Sora-Regular', marginBottom: 6 }}>
          {voucher.description}
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              backgroundColor: voucher.color + '15',
              borderRadius: 6,
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderWidth: 1,
              borderColor: voucher.color + '30',
              borderStyle: 'dashed',
            }}>
              <Text style={{ color: voucher.color, fontSize: 13, fontFamily: 'Sora-Bold', letterSpacing: 1 }}>
                {voucher.code}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => onCopy(voucher.code)}
            style={{
              backgroundColor: voucher.color,
              borderRadius: 8,
              paddingHorizontal: 14,
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: '#FFF', fontSize: 12, fontFamily: 'Sora-SemiBold' }}>Lưu</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, fontSize: 11, marginLeft: 4, fontFamily: 'Sora-Regular' }}>
            HSD: {voucher.expiryDate}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 11, marginLeft: 12, fontFamily: 'Sora-Regular' }}>
            • Tối thiểu {voucher.minOrder}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

// ===== MAIN PAGE =====
export default function Promotions() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Header animation
  const headerOpacity = useSharedValue(0);
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600 });
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: interpolate(headerOpacity.value, [0, 1], [-20, 0]) }],
  }));

  const handleCopyVoucher = (code: string) => {
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

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
          <Text style={{ fontSize: 18, fontFamily: 'Sora-SemiBold', color: colors.text }}>
            🎁 Khuyến mãi
          </Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Hero Banner */}
          <Animated.View style={headerStyle}>
            <LinearGradient
              colors={isDark ? ['#3D2B1F', '#1A1A2E'] : ['#C67C4E', '#A0522D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                marginHorizontal: 16,
                marginTop: 16,
                borderRadius: 24,
                padding: 24,
                overflow: 'hidden',
              }}
            >
              {/* Decorative circles */}
              <View style={{
                position: 'absolute', top: -30, right: -30,
                width: 120, height: 120, borderRadius: 60,
                backgroundColor: 'rgba(255,255,255,0.08)',
              }} />
              <View style={{
                position: 'absolute', bottom: -20, left: -20,
                width: 80, height: 80, borderRadius: 40,
                backgroundColor: 'rgba(255,255,255,0.05)',
              }} />

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                }}>
                  <Text style={{ color: '#FFF', fontSize: 12, fontFamily: 'Sora-SemiBold' }}>
                    🔥 HOT
                  </Text>
                </View>
              </View>

              <Text style={{
                color: '#FFF',
                fontSize: 26,
                fontFamily: 'Sora-Bold',
                marginBottom: 6,
                lineHeight: 34,
              }}>
                Ưu đãi mùa hè{'\n'}Giảm đến 50%
              </Text>
              <Text style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: 14,
                fontFamily: 'Sora-Regular',
                marginBottom: 16,
              }}>
                Hàng loạt ưu đãi hấp dẫn đang chờ bạn!
              </Text>

              <TouchableOpacity
                onPress={() => router.push('/(tabs)/home')}
                style={{
                  backgroundColor: '#FFF',
                  borderRadius: 14,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  alignSelf: 'flex-start',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#C67C4E', fontSize: 14, fontFamily: 'Sora-Bold', marginRight: 6 }}>
                  Đặt ngay
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#C67C4E" />
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>

          {/* Flash Deals Section */}
          <View style={{ marginTop: 28 }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              marginBottom: 14,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, marginRight: 8 }}>⚡</Text>
                <Text style={{ fontSize: 18, fontFamily: 'Sora-Bold', color: colors.text }}>
                  Flash Deals
                </Text>
              </View>
              <View style={{
                backgroundColor: '#FF4757',
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 4,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <Ionicons name="flame" size={14} color="#FFF" />
                <Text style={{ color: '#FFF', fontSize: 12, fontFamily: 'Sora-SemiBold', marginLeft: 4 }}>
                  Có hạn
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 16, paddingRight: 2, paddingTop: 10 }}
            >
              {FLASH_DEALS.map((deal, index) => (
                <FlashDealCard key={deal.id} deal={deal} index={index} />
              ))}
            </ScrollView>
          </View>

          {/* Vouchers Section */}
          <View style={{ marginTop: 28, paddingHorizontal: 16 }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, marginRight: 8 }}>🎟️</Text>
                <Text style={{ fontSize: 18, fontFamily: 'Sora-Bold', color: colors.text }}>
                  Mã giảm giá
                </Text>
              </View>
              <Text style={{ color: '#C67C4E', fontSize: 13, fontFamily: 'Sora-SemiBold' }}>
                {VOUCHERS.length} mã
              </Text>
            </View>

            {/* Copied toast */}
            {copiedCode && (
              <View style={{
                backgroundColor: '#10B981',
                borderRadius: 12,
                padding: 12,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                <Text style={{ color: '#FFF', fontSize: 13, fontFamily: 'Sora-SemiBold', marginLeft: 8 }}>
                  Đã lưu mã {copiedCode} thành công! ✅
                </Text>
              </View>
            )}

            {VOUCHERS.map((voucher, index) => (
              <VoucherCard
                key={voucher.id}
                voucher={voucher}
                index={index}
                onCopy={handleCopyVoucher}
              />
            ))}
          </View>

          {/* Special Offers Section */}
          <View style={{ marginTop: 28, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 20, marginRight: 8 }}>✨</Text>
              <Text style={{ fontSize: 18, fontFamily: 'Sora-Bold', color: colors.text }}>
                Ưu đãi đặc biệt
              </Text>
            </View>

            {SPECIAL_OFFERS.map((offer) => (
              <TouchableOpacity
                key={offer.id}
                style={{
                  borderRadius: 16,
                  marginBottom: 12,
                  overflow: 'hidden',
                }}
              >
                <LinearGradient
                  colors={isDark
                    ? [offer.color + '25', offer.color + '10']
                    : [...offer.bgGradient]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderRadius: 16,
                    borderWidth: isDark ? 1 : 0,
                    borderColor: offer.color + '30',
                  }}
                >
                  <View style={{
                    width: 52, height: 52, borderRadius: 16,
                    backgroundColor: offer.color + '20',
                    alignItems: 'center', justifyContent: 'center',
                    marginRight: 14,
                  }}>
                    <MaterialCommunityIcons name={offer.icon as any} size={26} color={offer.color} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{
                      color: isDark ? colors.text : '#1F2937',
                      fontSize: 15,
                      fontFamily: 'Sora-SemiBold',
                      marginBottom: 3,
                    }}>
                      {offer.title}
                    </Text>
                    <Text style={{
                      color: isDark ? colors.textSecondary : '#6B7280',
                      fontSize: 12,
                      fontFamily: 'Sora-Regular',
                      lineHeight: 18,
                    }}>
                      {offer.description}
                    </Text>
                  </View>

                  <Entypo name="chevron-right" size={20} color={offer.color} />
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bottom CTA */}
          <View style={{ marginTop: 20, paddingHorizontal: 16, alignItems: 'center' }}>
            <View style={{
              backgroundColor: isDark ? '#2A2A2A' : '#FFF8F0',
              borderRadius: 20,
              padding: 24,
              alignItems: 'center',
              width: '100%',
              borderWidth: 1,
              borderColor: isDark ? '#3A3A3A' : '#F0E0D0',
            }}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>☕</Text>
              <Text style={{
                color: colors.text,
                fontSize: 16,
                fontFamily: 'Sora-SemiBold',
                textAlign: 'center',
                marginBottom: 6,
              }}>
                Đặt ngay, nhận ngay ưu đãi!
              </Text>
              <Text style={{
                color: colors.textSecondary,
                fontSize: 13,
                fontFamily: 'Sora-Regular',
                textAlign: 'center',
                marginBottom: 16,
              }}>
                Ưu đãi có hạn, đừng bỏ lỡ nhé 💛
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/home')}
                style={{
                  backgroundColor: '#C67C4E',
                  borderRadius: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 40,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="cafe" size={18} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={{ color: '#FFF', fontSize: 15, fontFamily: 'Sora-Bold' }}>
                  Khám phá menu
                </Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
      </PageTransition>
    </GestureHandlerRootView>
  );
}
