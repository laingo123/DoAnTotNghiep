import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { Ionicons, Entypo, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeContext';
import { useLanguage } from '@/components/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import PageTransition from '@/components/PageTransition';
import { formatVNDFromUSD } from '@/utils/currency';
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
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ===== DATA =====

const MOODS = [
  { id: 'energetic', emoji: '⚡', label: 'Năng lượng', color: '#FF6B35' },
  { id: 'relaxed', emoji: '😌', label: 'Thư giãn', color: '#10B981' },
  { id: 'focused', emoji: '🎯', label: 'Tập trung', color: '#3B82F6' },
  { id: 'romantic', emoji: '💕', label: 'Lãng mạn', color: '#EC4899' },
  { id: 'adventurous', emoji: '🌟', label: 'Phiêu lưu', color: '#8B5CF6' },
  { id: 'cozy', emoji: '🧣', label: 'Ấm áp', color: '#F59E0B' },
];

const MOOD_RECOMMENDATIONS: { [key: string]: { drink: string; description: string; price: string; icon: string } } = {
  energetic: { drink: 'Double Espresso', description: 'Shot đôi mạnh mẽ, đánh thức mọi giác quan!', price: formatVNDFromUSD(3.5), icon: '⚡' },
  relaxed: { drink: 'Chamomile Latte', description: 'Latte hoa cúc dịu nhẹ, thư thái tâm hồn', price: formatVNDFromUSD(4.5), icon: '🌿' },
  focused: { drink: 'Cold Brew Nitro', description: 'Cà phê lạnh nitrogen, tỉnh táo cả ngày dài', price: formatVNDFromUSD(5.0), icon: '🧊' },
  romantic: { drink: 'Rose Cappuccino', description: 'Cappuccino hoa hồng, ngọt ngào từng giọt', price: formatVNDFromUSD(5.5), icon: '🌹' },
  adventurous: { drink: 'Coconut Mocha', description: 'Mocha dừa nhiệt đới, trải nghiệm mới lạ', price: formatVNDFromUSD(5.0), icon: '🥥' },
  cozy: { drink: 'Salted Caramel Latte', description: 'Latte caramel muối, ấm lòng ngày se lạnh', price: formatVNDFromUSD(4.8), icon: '🍯' },
};

const COFFEE_ORIGINS = [
  { country: 'Ethiopia 🇪🇹', flag: '🇪🇹', region: 'Đông Phi', flavor: 'Trái cây, Hoa', altitude: '1500-2200m', description: 'Quê hương của cà phê, nơi khởi nguồn mọi câu chuyện', color: '#059669', fact: 'Ethiopia là nơi phát hiện cà phê đầu tiên vào thế kỷ 9' },
  { country: 'Colombia 🇨🇴', flag: '🇨🇴', region: 'Nam Mỹ', flavor: 'Caramel, Hạt', altitude: '1200-1800m', description: 'Vùng đất sản sinh những hạt Arabica hoàn hảo nhất', color: '#D97706', fact: 'Colombia là nước sản xuất Arabica lớn thứ 2 thế giới' },
  { country: 'Vietnam 🇻🇳', flag: '🇻🇳', region: 'Đông Nam Á', flavor: 'Sô-cô-la, Đậm đà', altitude: '500-1500m', description: 'Cà phê Robusta đậm đà, đặc trưng phin Việt', color: '#DC2626', fact: 'Việt Nam là nước xuất khẩu cà phê lớn thứ 2 thế giới' },
  { country: 'Brazil 🇧🇷', flag: '🇧🇷', region: 'Nam Mỹ', flavor: 'Chocolate, Hạnh nhân', altitude: '800-1600m', description: 'Vương quốc cà phê, sản lượng lớn nhất hành tinh', color: '#16A34A', fact: 'Brazil sản xuất 1/3 lượng cà phê toàn cầu' },
  { country: 'Jamaica 🇯🇲', flag: '🇯🇲', region: 'Caribbean', flavor: 'Ngọt, Mềm mại', altitude: '900-1700m', description: 'Blue Mountain - loại cà phê đắt nhất thế giới', color: '#2563EB', fact: 'Jamaica Blue Mountain có giá lên đến khoảng 2.500.000đ/pound' },
];

const FUN_FACTS = [
  { fact: 'Cà phê là loại thức uống phổ biến thứ 2 trên thế giới, chỉ sau nước lọc', emoji: '🌍' },
  { fact: 'Phần Lan là quốc gia tiêu thụ cà phê nhiều nhất — 12kg/người/năm', emoji: '🇫🇮' },
  { fact: 'Beethoven đếm chính xác 60 hạt cà phê cho mỗi tách', emoji: '🎵' },
  { fact: 'Cà phê có thể giúp bạn đốt cháy chất béo nhanh hơn 29%', emoji: '🔥' },
  { fact: 'Trên thế giới có hơn 2.25 tỷ tách cà phê được uống mỗi ngày', emoji: '☕' },
  { fact: 'Cà phê đắt nhất thế giới là Kopi Luwak — khoảng 15.000.000đ/pound', emoji: '💎' },
  { fact: 'Espresso thực ra có ít caffeine hơn cà phê lọc thông thường', emoji: '😮' },
  { fact: 'Từ "coffee" có nguồn gốc từ tiếng Ả Rập "qahwa" nghĩa là rượu vang', emoji: '📖' },
];

const SPIN_PRIZES = [
  { label: 'Giảm 10%', color: '#C67C4E', textColor: '#FFF' },
  { label: 'Free Ship', color: '#10B981', textColor: '#FFF' },
  { label: 'Giảm 5%', color: '#3B82F6', textColor: '#FFF' },
  { label: 'Giảm 20%', color: '#EC4899', textColor: '#FFF' },
  { label: 'Free Size Up', color: '#8B5CF6', textColor: '#FFF' },
  { label: '1 Topping Free', color: '#F59E0B', textColor: '#FFF' },
  { label: 'Giảm 15%', color: '#EF4444', textColor: '#FFF' },
  { label: 'Thêm Shot Free', color: '#06B6D4', textColor: '#FFF' },
];

const BREWING_METHODS = [
  { id: 'espresso', name: 'Espresso', icon: '☕', time: '25 giây', temp: '92°C', grind: 'Rất mịn', ratio: '1:2', description: 'Áp suất cao, hương vị đậm đặc', gradient: ['#4A2C17', '#8B6914'] as const },
  { id: 'pourover', name: 'Pour Over', icon: '🫗', time: '3-4 phút', temp: '96°C', grind: 'Trung bình', ratio: '1:15', description: 'Nhẹ nhàng tinh tế, tách hương rõ nét', gradient: ['#1E3A5F', '#4A90D9'] as const },
  { id: 'phin', name: 'Phin Việt Nam', icon: '🇻🇳', time: '4-5 phút', temp: '95°C', grind: 'Trung bình thô', ratio: '1:6', description: 'Đậm đà bản sắc, thưởng thức từ từ', gradient: ['#8B0000', '#CC3333'] as const },
  { id: 'frenchpress', name: 'French Press', icon: '🍶', time: '4 phút', temp: '93°C', grind: 'Thô', ratio: '1:12', description: 'Full body, giữ nguyên dầu cà phê', gradient: ['#2D5016', '#6B8E23'] as const },
  { id: 'aeropress', name: 'AeroPress', icon: '🔬', time: '1-2 phút', temp: '85°C', grind: 'Mịn-Trung', ratio: '1:6', description: 'Linh hoạt sáng tạo, vị sạch gọn', gradient: ['#4B0082', '#9370DB'] as const },
];

// ===== COMPONENTS =====

// Mood Selector with animated recommendation
const MoodSelector = ({ colors, isDark }: { colors: any; isDark: boolean }) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const recommendation = selectedMood ? MOOD_RECOMMENDATIONS[selectedMood] : null;
  const router = useRouter();
  
  const recScale = useSharedValue(0);
  const recOpacity = useSharedValue(0);

  const showRecommendation = useCallback((moodId: string) => {
    setSelectedMood(moodId);
    recScale.value = 0;
    recOpacity.value = 0;
    recScale.value = withSpring(1, { damping: 12 });
    recOpacity.value = withTiming(1, { duration: 300 });
  }, []);

  const recStyle = useAnimatedStyle(() => ({
    transform: [{ scale: recScale.value }],
    opacity: recOpacity.value,
  }));

  return (
    <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <Text style={{ fontSize: 20, marginRight: 8 }}>🎭</Text>
        <Text style={{ fontSize: 18, fontFamily: 'Sora-Bold', color: colors.text }}>
          Hôm nay bạn thấy thế nào?
        </Text>
      </View>
      <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Sora-Regular', marginBottom: 16 }}>
        Chọn tâm trạng để nhận gợi ý đồ uống phù hợp nhất
      </Text>

      {/* Mood Grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {MOODS.map((mood) => {
          const isSelected = selectedMood === mood.id;
          return (
            <TouchableOpacity
              key={mood.id}
              onPress={() => showRecommendation(mood.id)}
              style={{
                width: '31%',
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: 'center',
                marginBottom: 10,
                backgroundColor: isSelected ? mood.color : (isDark ? '#2A2A2A' : '#F8F8F8'),
                borderWidth: isSelected ? 0 : 1,
                borderColor: isDark ? '#3A3A3A' : '#E8E8E8',
                shadowColor: isSelected ? mood.color : 'transparent',
                shadowOpacity: isSelected ? 0.3 : 0,
                shadowRadius: 8,
                elevation: isSelected ? 4 : 0,
              }}
            >
              <Text style={{ fontSize: 28, marginBottom: 6 }}>{mood.emoji}</Text>
              <Text style={{
                fontSize: 12,
                fontFamily: 'Sora-SemiBold',
                color: isSelected ? '#FFF' : colors.text,
              }}>
                {mood.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Recommendation Card */}
      {recommendation && (
        <Animated.View style={[{
          marginTop: 8,
          borderRadius: 20,
          overflow: 'hidden',
        }, recStyle]}>
          <LinearGradient
            colors={isDark ? ['#2A2A2A', '#1A1A2A'] : ['#FFF8F0', '#FFF0E0']}
            style={{
              padding: 20,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: isDark ? '#3A3A3A' : '#F0E0D0',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{
                width: 48, height: 48, borderRadius: 24,
                backgroundColor: (MOODS.find(m => m.id === selectedMood)?.color || '#C67C4E') + '20',
                alignItems: 'center', justifyContent: 'center', marginRight: 14,
              }}>
                <Text style={{ fontSize: 24 }}>{recommendation.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: 'Sora-Regular' }}>
                  Gợi ý cho bạn
                </Text>
                <Text style={{ color: colors.text, fontSize: 18, fontFamily: 'Sora-Bold' }}>
                  {recommendation.drink}
                </Text>
              </View>
              <Text style={{ color: '#C67C4E', fontSize: 20, fontFamily: 'Sora-Bold' }}>
                {recommendation.price}
              </Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Sora-Regular', marginBottom: 14, lineHeight: 20 }}>
              {recommendation.description}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/home')}
              style={{
                backgroundColor: '#C67C4E',
                borderRadius: 14,
                paddingVertical: 12,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="cafe" size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={{ color: '#FFF', fontSize: 14, fontFamily: 'Sora-SemiBold' }}>
                Đặt ngay
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      )}
    </View>
  );
};

// Coffee of the Day
const CoffeeOfTheDay = ({ colors, isDark }: { colors: any; isDark: boolean }) => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const todayFact = FUN_FACTS[dayOfYear % FUN_FACTS.length];
  
  const shimmer = useSharedValue(0);
  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1, true
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.7, 1, 0.7]),
  }));

  return (
    <View style={{ marginTop: 28, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <Text style={{ fontSize: 20, marginRight: 8 }}>💡</Text>
        <Text style={{ fontSize: 18, fontFamily: 'Sora-Bold', color: colors.text }}>
          Bạn có biết?
        </Text>
      </View>

      <Animated.View style={shimmerStyle}>
        <LinearGradient
          colors={isDark ? ['#1E293B', '#334155'] : ['#EEF2FF', '#E0E7FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: isDark ? '#475569' : '#C7D2FE',
          }}
        >
          <Text style={{ fontSize: 40, marginBottom: 10, textAlign: 'center' }}>
            {todayFact.emoji}
          </Text>
          <Text style={{
            color: isDark ? '#E2E8F0' : '#1E293B',
            fontSize: 16,
            fontFamily: 'Sora-SemiBold',
            textAlign: 'center',
            lineHeight: 24,
          }}>
            {todayFact.fact}
          </Text>
          <View style={{
            marginTop: 14,
            alignSelf: 'center',
            backgroundColor: isDark ? '#475569' : '#C7D2FE',
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 4,
          }}>
            <Text style={{ color: isDark ? '#94A3B8' : '#4338CA', fontSize: 11, fontFamily: 'Sora-Regular' }}>
              Fun Fact #{(dayOfYear % FUN_FACTS.length) + 1}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

// Coffee Origins Map
const CoffeeOrigins = ({ colors, isDark }: { colors: any; isDark: boolean }) => {
  const [expandedOrigin, setExpandedOrigin] = useState<number | null>(null);

  return (
    <View style={{ marginTop: 28 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 6 }}>
        <Text style={{ fontSize: 20, marginRight: 8 }}>🌍</Text>
        <Text style={{ fontSize: 18, fontFamily: 'Sora-Bold', color: colors.text }}>
          Hành trình cà phê thế giới
        </Text>
      </View>
      <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Sora-Regular', paddingHorizontal: 16, marginBottom: 14 }}>
        Khám phá nguồn gốc của từng hạt cà phê
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 16, paddingRight: 4 }}
      >
        {COFFEE_ORIGINS.map((origin, index) => {
          const isExpanded = expandedOrigin === index;
          return (
            <TouchableOpacity
              key={index}
              onPress={() => setExpandedOrigin(isExpanded ? null : index)}
              activeOpacity={0.85}
              style={{ width: isExpanded ? 280 : 160, marginRight: 12 }}
            >
              <LinearGradient
                colors={isDark
                  ? [origin.color + '30', origin.color + '10']
                  : [origin.color + '15', origin.color + '08']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 20,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: origin.color + (isDark ? '40' : '25'),
                  minHeight: isExpanded ? 220 : 180,
                }}
              >
                <Text style={{ fontSize: 36, marginBottom: 8 }}>{origin.flag}</Text>
                <Text style={{
                  color: origin.color,
                  fontSize: 16,
                  fontFamily: 'Sora-Bold',
                  marginBottom: 4,
                }}>
                  {origin.country}
                </Text>
                <View style={{
                  backgroundColor: origin.color + '20',
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  alignSelf: 'flex-start',
                  marginBottom: 8,
                }}>
                  <Text style={{ color: origin.color, fontSize: 11, fontFamily: 'Sora-SemiBold' }}>
                    {origin.region}
                  </Text>
                </View>
                <Text style={{
                  color: colors.textSecondary,
                  fontSize: 12,
                  fontFamily: 'Sora-Regular',
                  lineHeight: 18,
                }}>
                  {origin.description}
                </Text>

                {isExpanded && (
                  <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: origin.color + '20', paddingTop: 12 }}>
                    <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: 'Sora-Regular', width: 65 }}>Hương vị:</Text>
                      <Text style={{ color: colors.text, fontSize: 11, fontFamily: 'Sora-SemiBold', flex: 1 }}>{origin.flavor}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: 'Sora-Regular', width: 65 }}>Độ cao:</Text>
                      <Text style={{ color: colors.text, fontSize: 11, fontFamily: 'Sora-SemiBold', flex: 1 }}>{origin.altitude}</Text>
                    </View>
                    <View style={{
                      marginTop: 8,
                      backgroundColor: origin.color + '15',
                      borderRadius: 10,
                      padding: 10,
                    }}>
                      <Text style={{ color: origin.color, fontSize: 11, fontFamily: 'Sora-Regular', fontStyle: 'italic', lineHeight: 16 }}>
                        💡 {origin.fact}
                      </Text>
                    </View>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// Brewing Guide
const BrewingGuide = ({ colors, isDark }: { colors: any; isDark: boolean }) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  return (
    <View style={{ marginTop: 28, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <Text style={{ fontSize: 20, marginRight: 8 }}>🧪</Text>
        <Text style={{ fontSize: 18, fontFamily: 'Sora-Bold', color: colors.text }}>
          Phương pháp pha chế
        </Text>
      </View>
      <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Sora-Regular', marginBottom: 14 }}>
        Khám phá cách pha cà phê hoàn hảo
      </Text>

      {BREWING_METHODS.map((method) => {
        const isSelected = selectedMethod === method.id;
        return (
          <TouchableOpacity
            key={method.id}
            onPress={() => setSelectedMethod(isSelected ? null : method.id)}
            activeOpacity={0.85}
            style={{ marginBottom: 10 }}
          >
            <LinearGradient
              colors={isSelected
                ? [...method.gradient]
                : isDark ? ['#2A2A2A', '#222222'] : ['#FAFAFA', '#F5F5F5']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 16,
                padding: 16,
                borderWidth: isSelected ? 0 : 1,
                borderColor: isDark ? '#333' : '#E8E8E8',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 28, marginRight: 12 }}>{method.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      color: isSelected ? '#FFF' : colors.text,
                      fontSize: 16,
                      fontFamily: 'Sora-SemiBold',
                    }}>
                      {method.name}
                    </Text>
                    <Text style={{
                      color: isSelected ? 'rgba(255,255,255,0.7)' : colors.textSecondary,
                      fontSize: 12,
                      fontFamily: 'Sora-Regular',
                      marginTop: 2,
                    }}>
                      {method.description}
                    </Text>
                  </View>
                </View>
                <Entypo
                  name={isSelected ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={isSelected ? '#FFF' : colors.textSecondary}
                />
              </View>

              {isSelected && (
                <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: 14 }}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    {[
                      { label: '⏱ Thời gian', value: method.time },
                      { label: '🌡 Nhiệt độ', value: method.temp },
                      { label: '🔧 Xay', value: method.grind },
                      { label: '⚖️ Tỷ lệ', value: method.ratio },
                    ].map((item) => (
                      <View key={item.label} style={{
                        width: '48%',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 8,
                      }}>
                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: 'Sora-Regular', marginBottom: 4 }}>
                          {item.label}
                        </Text>
                        <Text style={{ color: '#FFF', fontSize: 15, fontFamily: 'Sora-Bold' }}>
                          {item.value}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// Lucky Spin Wheel
const LuckySpin = ({ colors, isDark }: { colors: any; isDark: boolean }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [hasSpun, setHasSpun] = useState(false);
  const rotation = useSharedValue(0);
  const resultScale = useSharedValue(0);

  const handleSpin = () => {
    if (isSpinning || hasSpun) return;
    setIsSpinning(true);
    setResult(null);
    resultScale.value = 0;

    const prizeIndex = Math.floor(Math.random() * SPIN_PRIZES.length);
    const extraRotation = 360 * 5 + (prizeIndex * (360 / SPIN_PRIZES.length));

    rotation.value = withTiming(extraRotation, {
      duration: 4000,
      easing: Easing.out(Easing.cubic),
    }, () => {
      runOnJS(onSpinEnd)(prizeIndex);
    });
  };

  const onSpinEnd = (prizeIndex: number) => {
    setIsSpinning(false);
    setHasSpun(true);
    setResult(SPIN_PRIZES[prizeIndex].label);
    resultScale.value = withSpring(1, { damping: 8 });
  };

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const resultAnim = useAnimatedStyle(() => ({
    transform: [{ scale: resultScale.value }],
    opacity: resultScale.value,
  }));

  const SLICE_ANGLE = 360 / SPIN_PRIZES.length;

  return (
    <View style={{ marginTop: 28, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <Text style={{ fontSize: 20, marginRight: 8 }}>🎰</Text>
        <Text style={{ fontSize: 18, fontFamily: 'Sora-Bold', color: colors.text }}>
          Vòng quay may mắn
        </Text>
      </View>
      <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Sora-Regular', marginBottom: 16 }}>
        Quay để nhận ưu đãi bất ngờ mỗi ngày! (1 lần/ngày)
      </Text>

      <View style={{ alignItems: 'center' }}>
        {/* Wheel Container */}
        <View style={{
          width: 280, height: 280,
          alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          {/* Arrow Pointer */}
          <View style={{
            position: 'absolute', top: -5, zIndex: 10,
            width: 0, height: 0,
            borderLeftWidth: 14, borderRightWidth: 14, borderTopWidth: 24,
            borderLeftColor: 'transparent', borderRightColor: 'transparent',
            borderTopColor: '#FF4757',
          }} />

          {/* Wheel */}
          <Animated.View style={[{
            width: 260, height: 260, borderRadius: 130,
            overflow: 'hidden',
            borderWidth: 4,
            borderColor: isDark ? '#555' : '#DDD',
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 8,
          }, wheelStyle]}>
            {/* Wheel Slices */}
            {SPIN_PRIZES.map((prize, index) => {
              const angle = index * SLICE_ANGLE;
              return (
                <View key={index} style={{
                  position: 'absolute',
                  width: '100%', height: '100%',
                  alignItems: 'center',
                }}>
                  <View style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: prize.color,
                    opacity: 0.9,
                    transform: [
                      { rotate: `${angle}deg` },
                    ],
                    borderWidth: 0.5,
                    borderColor: 'rgba(255,255,255,0.2)',
                  }}>
                    <View style={{
                      position: 'absolute',
                      top: 20,
                      left: '50%',
                      marginLeft: -35,
                      width: 70,
                      transform: [{ rotate: `${SLICE_ANGLE / 2}deg` }],
                    }}>
                      <Text style={{
                        color: '#FFF',
                        fontSize: 9,
                        fontFamily: 'Sora-Bold',
                        textAlign: 'center',
                      }}>
                        {prize.label}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Center circle */}
            <View style={{
              position: 'absolute',
              width: 50, height: 50, borderRadius: 25,
              backgroundColor: isDark ? '#333' : '#FFF',
              alignItems: 'center', justifyContent: 'center',
              top: '50%', left: '50%',
              marginTop: -25, marginLeft: -25,
              zIndex: 5,
              shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
              borderWidth: 3,
              borderColor: '#C67C4E',
            }}>
              <Text style={{ fontSize: 18 }}>☕</Text>
            </View>
          </Animated.View>
        </View>

        {/* Spin Button */}
        <TouchableOpacity
          onPress={handleSpin}
          disabled={isSpinning || hasSpun}
          style={{
            marginTop: 20,
            backgroundColor: isSpinning ? '#999' : hasSpun ? '#666' : '#C67C4E',
            borderRadius: 16,
            paddingVertical: 14,
            paddingHorizontal: 50,
            shadowColor: '#C67C4E',
            shadowOpacity: isSpinning || hasSpun ? 0 : 0.4,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text style={{ color: '#FFF', fontSize: 16, fontFamily: 'Sora-Bold' }}>
            {isSpinning ? '🎡 Đang quay...' : hasSpun ? '✅ Đã quay hôm nay' : '🎰 QUAY NGAY!'}
          </Text>
        </TouchableOpacity>

        {/* Result */}
        {result && (
          <Animated.View style={[{
            marginTop: 16,
            backgroundColor: '#10B981',
            borderRadius: 16,
            padding: 16,
            width: '100%',
            alignItems: 'center',
          }, resultAnim]}>
            <Text style={{ fontSize: 28, marginBottom: 6 }}>🎉</Text>
            <Text style={{ color: '#FFF', fontSize: 18, fontFamily: 'Sora-Bold', marginBottom: 4 }}>
              Chúc mừng bạn!
            </Text>
            <Text style={{ color: '#FFF', fontSize: 15, fontFamily: 'Sora-Regular' }}>
              Bạn nhận được: <Text style={{ fontFamily: 'Sora-Bold' }}>{result}</Text>
            </Text>
            <View style={{
              marginTop: 10,
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 6,
            }}>
              <Text style={{ color: '#FFF', fontSize: 12, fontFamily: 'Sora-Regular' }}>
                Ưu đãi sẽ tự động áp dụng khi bạn đặt hàng
              </Text>
            </View>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

// ===== MAIN PAGE =====
export default function CoffeeExplorer() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  // Hero animation
  const heroY = useSharedValue(30);
  const heroOpacity = useSharedValue(0);

  useEffect(() => {
    heroY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) });
    heroOpacity.value = withTiming(1, { duration: 600 });
  }, []);

  const heroStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: heroY.value }],
    opacity: heroOpacity.value,
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
          <Text style={{ fontSize: 18, fontFamily: 'Sora-SemiBold', color: colors.text }}>
            ☕ Khám phá cà phê
          </Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Hero Section */}
          <Animated.View style={heroStyle}>
            <LinearGradient
              colors={isDark
                ? ['#1A0F07', '#2D1810', '#0F172A']
                : ['#3B1F0B', '#5C2E0E', '#8B4513']
              }
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
              {/* Decorative */}
              <View style={{
                position: 'absolute', top: -40, right: -20,
                width: 140, height: 140, borderRadius: 70,
                backgroundColor: 'rgba(198,124,78,0.15)',
              }} />
              <View style={{
                position: 'absolute', bottom: -30, left: 10,
                width: 100, height: 100, borderRadius: 50,
                backgroundColor: 'rgba(198,124,78,0.08)',
              }} />

              <Text style={{ fontSize: 44, marginBottom: 8 }}>☕</Text>
              <Text style={{
                color: '#FFF',
                fontSize: 24,
                fontFamily: 'Sora-Bold',
                marginBottom: 6,
                lineHeight: 32,
              }}>
                Hành trình cà phê{'\n'}của riêng bạn
              </Text>
              <Text style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: 14,
                fontFamily: 'Sora-Regular',
                lineHeight: 22,
              }}>
                Khám phá hương vị, nguồn gốc và nghệ thuật pha chế cà phê từ khắp nơi trên thế giới
              </Text>

              {/* Stats Row */}
              <View style={{
                flexDirection: 'row',
                marginTop: 20,
                justifyContent: 'space-between',
              }}>
                {[
                  { number: '70+', label: 'Quốc gia' },
                  { number: '120+', label: 'Giống cà phê' },
                  { number: '2.25B', label: 'Tách/ngày' },
                ].map((stat) => (
                  <View key={stat.label} style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 14,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    alignItems: 'center',
                    flex: 1,
                    marginHorizontal: 4,
                  }}>
                    <Text style={{ color: '#C67C4E', fontSize: 18, fontFamily: 'Sora-Bold' }}>
                      {stat.number}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontFamily: 'Sora-Regular', marginTop: 2 }}>
                      {stat.label}
                    </Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Mood Selector */}
          <MoodSelector colors={colors} isDark={isDark} />

          {/* Coffee of the Day */}
          <CoffeeOfTheDay colors={colors} isDark={isDark} />

          {/* Coffee Origins */}
          <CoffeeOrigins colors={colors} isDark={isDark} />

          {/* Brewing Guide */}
          <BrewingGuide colors={colors} isDark={isDark} />

          {/* Lucky Spin */}
          <LuckySpin colors={colors} isDark={isDark} />

          {/* Bottom padding */}
          <View style={{ height: 20 }} />

        </ScrollView>
      </SafeAreaView>
      </PageTransition>
    </GestureHandlerRootView>
  );
}
