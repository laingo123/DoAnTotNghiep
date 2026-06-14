import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StatusBar, StyleSheet, Dimensions } from 'react-native';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, FontAwesome5, Entypo } from '@expo/vector-icons';
import { useLanguage } from '@/components/LanguageContext';
import { useTheme } from '@/components/ThemeContext';
import PageTransition from '@/components/PageTransition';
import { fireBaseDB } from '@/config/firebaseConfig';
import { ref, onValue, off } from 'firebase/database';
import SimulatedMap from '@/components/SimulatedMap';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TRACKING_STEPS = [
  { title: 'Đã nhận đơn hàng', desc: 'Cửa hàng đã nhận thông tin đặt món của bạn.', icon: 'receipt-outline' },
  { title: 'Đang chuẩn bị', desc: 'Barista đang pha chế tách cà phê thơm ngon cho bạn.', icon: 'cafe-outline' },
  { title: 'Đang giao hàng', desc: 'Tài xế đang nhanh chóng giao nước đến địa chỉ của bạn.', icon: 'bicycle-outline' },
  { title: 'Giao thành công', desc: 'Chúc bạn thưởng thức ly cà phê thật ngon miệng!', icon: 'checkmark-done-circle-outline' },
];

export default function OrderTracking() {
  const router = useRouter();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(720); // 12 minutes default
  const [distance, setDistance] = useState<number | null>(2.2); // fallback distance
  const [duration, setDuration] = useState<number | null>(12); // fallback duration
  const [isDelivery, setIsDelivery] = useState(true);

  // Sync with Firebase Database if orderId is provided
  useEffect(() => {
    if (!orderId) {
      // Fallback demo simulation
      const timer1 = setTimeout(() => setCurrentStep(1), 6000);   // After 6s, preparing
      const timer2 = setTimeout(() => setCurrentStep(2), 14000);  // After 14s, delivering
      const timer3 = setTimeout(() => setCurrentStep(3), 22000);  // After 22s, completed
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }

    const orderRef = ref(fireBaseDB, `orders/${orderId}`);
    const unsubscribe = onValue(orderRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.deliveryType !== undefined) {
          setIsDelivery(data.deliveryType === 'delivery');
        }
        
        if (data.distance !== undefined && data.distance !== null) {
          setDistance(data.distance);
        }
        
        if (data.duration !== undefined && data.duration !== null) {
          setDuration(data.duration);
          if (data.status !== 'completed') {
            // Adjust remaining time factor based on status
            let factor = 1.0;
            if (data.status === 'preparing') factor = 0.8;
            else if (data.status === 'delivering') factor = 0.5;
            setTimeLeft(Math.round(data.duration * 60 * factor));
          }
        }

        // Map database status string to step index:
        // pending -> 0, preparing -> 1, delivering -> 2, completed -> 3
        if (data.status === 'pending') {
          setCurrentStep(0);
        } else if (data.status === 'preparing') {
          setCurrentStep(1);
        } else if (data.status === 'delivering') {
          setCurrentStep(2);
        } else if (data.status === 'completed') {
          setCurrentStep(3);
          setTimeLeft(0);
        }
      }
    });

    return () => {
      off(orderRef);
    };
  }, [orderId]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || currentStep === 3) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, currentStep]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <PageTransition>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
        
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/home')} style={styles.headerBtn}>
            <Entypo name="cross" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Theo dõi đơn hàng</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Status Alert Banner */}
          <View style={[styles.banner, { backgroundColor: isDark ? '#2A1F18' : '#FFF0E0' }]}>
            <Ionicons name="sparkles" size={22} color="#C67C4E" />
            <Text style={[styles.bannerText, { color: isDark ? '#FFF' : '#3E2723' }]}>
              {currentStep === 3 
                ? 'Đơn hàng đã được giao thành công!' 
                : 'Cửa hàng đang xử lý đơn hàng của bạn.'}
            </Text>
          </View>

          {/* Time Counter Box */}
          <View style={[styles.timeBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Sora-Regular' }}>Thời gian giao dự kiến</Text>
            <Text style={[styles.timeText, { color: '#C67C4E' }]}>
              {currentStep === 3 ? 'Đã giao' : formatTime(timeLeft)}
            </Text>
            {currentStep < 3 && (
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: 'Sora-Regular', marginTop: 4 }}>
                Tài xế đang trên đường đến
              </Text>
            )}
          </View>

          {/* Simulated Route Map */}
          {isDelivery && (
            <SimulatedMap
              distance={distance}
              duration={duration}
              isDark={isDark}
              isTracking={true}
              step={currentStep}
            />
          )}

          {/* Stepper Tracking Progress */}
          <View style={[styles.stepperContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {TRACKING_STEPS.map((step, index) => {
              const isCompleted = index < currentStep;
              const isActive = index === currentStep;
              const isPending = index > currentStep;

              return (
                <View key={index} style={styles.stepRow}>
                  {/* Left Column: Icon Indicator & Connecting Lines */}
                  <View style={styles.indicatorCol}>
                    <View style={[
                      styles.indicatorCircle,
                      {
                        backgroundColor: isCompleted 
                          ? '#10B981' 
                          : isActive 
                          ? '#C67C4E' 
                          : (isDark ? '#333' : '#E0E0E0'),
                        borderColor: isActive ? '#FFE0D0' : 'transparent',
                        borderWidth: isActive ? 4 : 0
                      }
                    ]}>
                      <Ionicons 
                        name={isCompleted ? 'checkmark' : step.icon as any} 
                        size={isCompleted ? 14 : 16} 
                        color="#FFF" 
                      />
                    </View>
                    {index < TRACKING_STEPS.length - 1 && (
                      <View style={[
                        styles.connectingLine,
                        { backgroundColor: index < currentStep ? '#10B981' : (isDark ? '#333' : '#E0E0E0') }
                      ]} />
                    )}
                  </View>

                  {/* Right Column: Title & Description */}
                  <View style={styles.stepInfo}>
                    <Text style={[
                      styles.stepTitle,
                      { 
                        color: isActive ? '#C67C4E' : isCompleted ? colors.text : colors.textSecondary,
                        fontFamily: isActive ? 'Sora-Bold' : 'Sora-SemiBold'
                      }
                    ]}>
                      {step.title}
                    </Text>
                    <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
                      {step.desc}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Shipper Info Card */}
          <View style={[styles.shipperCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80' }} 
                style={styles.shipperAvatar}
              />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 15, fontFamily: 'Sora-Bold' }}>Nguyễn Hoàng Nam</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Ionicons name="star" size={12} color="#FFB800" />
                  <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: 'Sora-Regular', marginLeft: 4 }}>
                    4.9 • Shipper của bạn
                  </Text>
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14 }}>
              <TouchableOpacity style={[styles.shipperActionBtn, { marginRight: 8, backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' }]}>
                <Ionicons name="call" size={16} color="#C67C4E" />
                <Text style={{ color: '#C67C4E', fontSize: 12, fontFamily: 'Sora-SemiBold', marginLeft: 8 }}>Gọi điện</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => router.push('/(tabs)/chatRoom')}
                style={[styles.shipperActionBtn, { marginLeft: 8, backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' }]}
              >
                <Ionicons name="chatbubble" size={16} color="#C67C4E" />
                <Text style={{ color: '#C67C4E', fontSize: 12, fontFamily: 'Sora-SemiBold', marginLeft: 8 }}>Nhắn tin</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Return Home Button */}
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/home')}
            style={styles.homeBtn}
          >
            <Text style={styles.homeBtnText}>Quay về trang chủ</Text>
          </TouchableOpacity>
        </ScrollView>
      </PageTransition>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Sora-SemiBold',
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  bannerText: {
    fontSize: 13,
    fontFamily: 'Sora-SemiBold',
    marginLeft: 10,
    flex: 1,
  },
  timeBox: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
  },
  timeText: {
    fontSize: 36,
    fontFamily: 'Sora-Bold',
    marginTop: 6,
  },
  stepperContainer: {
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 75,
  },
  indicatorCol: {
    alignItems: 'center',
    width: 30,
    marginRight: 12,
  },
  indicatorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  connectingLine: {
    width: 2,
    flex: 1,
    marginVertical: -2,
    zIndex: 1,
  },
  stepInfo: {
    flex: 1,
    paddingBottom: 16,
  },
  stepTitle: {
    fontSize: 15,
  },
  stepDesc: {
    fontSize: 12,
    fontFamily: 'Sora-Regular',
    marginTop: 4,
    lineHeight: 18,
  },
  shipperCard: {
    borderRadius: 20,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
  },
  shipperAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  shipperActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  homeBtn: {
    backgroundColor: '#C67C4E',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  homeBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Sora-Bold',
  },
});