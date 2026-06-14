// File: app/(tabs)/profile.tsx
import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/components/AuthContext";
import { useLanguage } from "@/components/LanguageContext";
import { useTheme } from "@/components/ThemeContext";
import PageTransition from "@/components/PageTransition";
import { LinearGradient } from "expo-linear-gradient";
import FaceScannerModal from "@/components/FaceScannerModal";

export default function Profile() {
  const router = useRouter();
  const { user, isAdmin, logout, walletBalance, loyaltyPoints, topUpWallet } = useAuth();
  const { language, t, toggleLanguage } = useLanguage();
  const { colors, isDark, toggleTheme } = useTheme();

  const [isFaceIdEnabled, setIsFaceIdEnabled] = React.useState(false);
  const [scannerVisible, setScannerVisible] = React.useState(false);

  React.useEffect(() => {
    if (user?.email && typeof window !== 'undefined' && window.localStorage) {
      const val = window.localStorage.getItem(`${user.email}_face_id_enabled`);
      setIsFaceIdEnabled(val === 'true');
    }
  }, [user]);

  const handleFaceIdSetup = () => {
    if (isFaceIdEnabled) {
      Alert.alert(
        "Tắt Face ID",
        "Bạn có chắc muốn hủy đăng nhập bằng khuôn mặt cho tài khoản này?",
        [
          {
            text: "Đồng ý tắt",
            onPress: () => {
              if (user?.email && typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.removeItem(`${user.email}_face_id_enabled`);
                // Clean up credentials if this was the logged-in Face ID account
                const savedEmail = window.localStorage.getItem('coffee_shop_face_id_email');
                if (savedEmail === user.email) {
                  window.localStorage.removeItem('coffee_shop_face_id_email');
                  window.localStorage.removeItem('coffee_shop_face_id_password');
                }
                setIsFaceIdEnabled(false);
                Alert.alert("Thành công", "Đã hủy kích hoạt Face ID.");
              }
            }
          },
          { text: "Hủy", style: "cancel" }
        ]
      );
    } else {
      setScannerVisible(true);
    }
  };

  const handleFaceScanSuccess = () => {
    if (user?.email && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`${user.email}_face_id_enabled`, 'true');
      window.localStorage.setItem('coffee_shop_face_id_email', user.email);
      if (user.password) {
        window.localStorage.setItem('coffee_shop_face_id_password', user.password);
      }
      setIsFaceIdEnabled(true);
      setScannerVisible(false);
      Alert.alert("Thành công", "Đã đăng ký Face ID thành công! Bạn có thể sử dụng khuôn mặt để đăng nhập nhanh kể từ lần sau.");
    }
  };

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  // Loyalty calculations
  let tierName = "ĐỒNG";
  let tierColor = "#CD7F32"; // Bronze
  let nextTierName = "BẠC";
  let nextTierPoints = 100;
  let prevTierPoints = 0;

  if (loyaltyPoints >= 1000) {
    tierName = "BẠCH KIM";
    tierColor = "#E5E4E2"; // Platinum
    nextTierName = "MAX";
    nextTierPoints = loyaltyPoints;
    prevTierPoints = 1000;
  } else if (loyaltyPoints >= 300) {
    tierName = "VÀNG";
    tierColor = "#FFD700"; // Gold
    nextTierName = "BẠCH KIM";
    nextTierPoints = 1000;
    prevTierPoints = 300;
  } else if (loyaltyPoints >= 100) {
    tierName = "BẠC";
    tierColor = "#C0C0C0"; // Silver
    nextTierName = "VÀNG";
    nextTierPoints = 300;
    prevTierPoints = 100;
  }

  const progress = nextTierPoints === prevTierPoints
    ? 1
    : (loyaltyPoints - prevTierPoints) / (nextTierPoints - prevTierPoints);

  const handleTopUp = () => {
    Alert.alert(
      "Nạp tiền ví Coffee Shop",
      "Chọn số tiền muốn nạp (Số dư hiện tại: $" + walletBalance.toFixed(2) + "):",
      [
        { text: "Nạp $10", onPress: () => { topUpWallet(10); Alert.alert("Thành công", "Đã nạp $10 vào ví!"); } },
        { text: "Nạp $20", onPress: () => { topUpWallet(20); Alert.alert("Thành công", "Đã nạp $20 vào ví!"); } },
        { text: "Nạp $50", onPress: () => { topUpWallet(50); Alert.alert("Thành công", "Đã nạp $50 vào ví!"); } },
        { text: "Hủy", style: "cancel" }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <PageTransition>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Custom Header */}
          <View style={styles.headerContainer}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <Entypo name="chevron-left" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {}}
              style={styles.headerButton}
            >
              <Entypo name="pencil" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Top Background */}
          <View style={styles.topBg} />

          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            <Image
              source={require("../../assets/images/avatar.jpg")}
              style={[styles.avatar, { borderColor: colors.background }]}
            />
          </View>

          {/* User Info */}
          <View style={styles.infoContainer}>
            <Text style={[styles.name, { color: colors.text }]}>{user?.name || 'Guest'}</Text>
            <Text style={[styles.phone, { color: colors.textSecondary }]}>{user?.email || ''}</Text>
            <View style={[styles.roleBadge, isAdmin ? styles.adminBadge : styles.userBadge]}>
              <Text style={[styles.roleText, isAdmin ? styles.adminText : styles.userText]}>
                {isAdmin ? t('admin') : t('user')}
              </Text>
            </View>
          </View>

          {/* Loyalty Membership Card */}
          <View style={{ marginHorizontal: 20, marginTop: 20 }}>
            <LinearGradient
              colors={isDark ? ['#1e1b18', '#2d241e'] : ['#3E2723', '#4E342E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 20,
                padding: 20,
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 10,
                elevation: 5,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Background Decorative Circles */}
              <View style={{ position: 'absolute', right: -30, bottom: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.03)' }} />
              <View style={{ position: 'absolute', right: 50, top: -40, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.02)' }} />

              {/* Card Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <View>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontFamily: 'Sora-Regular', letterSpacing: 1 }}>THẺ THÀNH VIÊN</Text>
                  <Text style={{ color: tierColor, fontSize: 18, fontFamily: 'Sora-Bold', marginTop: 2 }}>{tierName}</Text>
                </View>
                <Ionicons name="cafe" size={32} color={tierColor} />
              </View>

              {/* User & Points */}
              <View style={{ marginBottom: 15 }}>
                <Text style={{ color: '#FFF', fontSize: 16, fontFamily: 'Sora-SemiBold' }}>{user?.name || 'Guest'}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'Sora-Regular', marginTop: 2 }}>ID: #{user?.email?.split('@')[0].toUpperCase() || 'GUEST'}</Text>
              </View>

              {/* Points Progress */}
              <View style={{ marginTop: 5 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
                  <Text style={{ color: '#FFF', fontSize: 14, fontFamily: 'Sora-Bold' }}>
                    {loyaltyPoints} <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: 'Sora-Regular' }}>điểm</Text>
                  </Text>
                  {nextTierName !== 'MAX' ? (
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontFamily: 'Sora-Regular' }}>
                      Còn {nextTierPoints - loyaltyPoints} điểm để lên {nextTierName}
                    </Text>
                  ) : (
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontFamily: 'Sora-Regular' }}>
                      Hạng cao nhất
                    </Text>
                  )}
                </View>

                {/* Progress Bar */}
                <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' }}>
                  <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: tierColor }} />
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Wallet Balance Card */}
          <View style={[styles.card, { backgroundColor: colors.card, marginTop: 15 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: '#C67C4E20',
                  alignItems: 'center', justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <FontAwesome name="wallet" size={20} color="#C67C4E" />
                </View>
                <View>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: 'Sora-Regular' }}>Ví điện tử của tôi</Text>
                  <Text style={{ color: colors.text, fontSize: 18, fontFamily: 'Sora-Bold', marginTop: 2 }}>
                    ${walletBalance.toFixed(2)}
                    <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 'normal' }}>
                      {' '}(~{(walletBalance * 25000).toLocaleString('vi-VN')}đ)
                    </Text>
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleTopUp}
                style={{
                  backgroundColor: '#C67C4E',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: '#FFF', fontSize: 13, fontFamily: 'Sora-SemiBold' }}>Nạp tiền</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Account Card */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('account')}</Text>
            {[
              [t('gender'), user?.gender || t('male')],
              [t('birthday'), user?.birthday || "09 Dec 2004"],
              [t('location'), user?.location || "Da Nang"],
            ].map(([label, value]) => (
              <View key={label} style={styles.row}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
              </View>
            ))}
          </View>

          {/* Settings Card */}
          <View style={[styles.card, { backgroundColor: colors.card, paddingVertical: 8 }]}>
            {/* Language Toggle */}
            <View style={styles.rowCenter}>
              <View style={styles.socialRow}>
                <Text style={{ fontSize: 20 }}>{language === 'vi' ? '🇻🇳' : '🇬🇧'}</Text>
                <Text style={[styles.socialText, { color: colors.text }]}>{t('language')}</Text>
              </View>
              <TouchableOpacity
                onPress={toggleLanguage}
                style={[styles.langButton, { backgroundColor: language === 'vi' ? '#C67C4E' : '#666' }]}
              >
                <Text style={styles.langButtonText}>
                  {language === 'vi' ? 'VI' : 'EN'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />

            {/* Theme Toggle */}
            <View style={styles.rowCenter}>
              <View style={styles.socialRow}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={isDark ? '#FFD700' : '#FF8C00'} />
                <Text style={[styles.socialText, { color: colors.text }]}>
                  {isDark ? 'Chế độ tối' : 'Chế độ sáng'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={toggleTheme}
                style={[styles.themeButton, { backgroundColor: isDark ? '#444' : '#E0E0E0' }]}
              >
                <View style={[styles.themeToggle, isDark ? styles.themeToggleDark : styles.themeToggleLight]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Order History Button */}
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, paddingVertical: 8 }]}
            onPress={() => router.push('/order-history')}
          >
            <View style={styles.rowCenter}>
              <View style={styles.socialRow}>
                <Ionicons name="receipt-outline" size={20} color="#C67C4E" />
                <Text style={[styles.socialText, { color: colors.text }]}>
                  Lịch sử đơn hàng
                </Text>
              </View>
              <Entypo name="chevron-right" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>

          {/* Favorites Button */}
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, paddingVertical: 8, marginTop: 10 }]}
            onPress={() => router.push('/favorites')}
          >
            <View style={styles.rowCenter}>
              <View style={styles.socialRow}>
                <Ionicons name="heart-outline" size={20} color="#FF4757" />
                <Text style={[styles.socialText, { color: colors.text }]}>
                  Sản phẩm yêu thích
                </Text>
              </View>
              <Entypo name="chevron-right" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>

          {/* Promotions Button */}
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, paddingVertical: 8, marginTop: 10 }]}
            onPress={() => router.push('/promotions')}
          >
            <View style={styles.rowCenter}>
              <View style={styles.socialRow}>
                <Ionicons name="gift-outline" size={20} color="#F59E0B" />
                <Text style={[styles.socialText, { color: colors.text }]}>
                  Khuyến mãi & Ưu đãi
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  backgroundColor: '#FF4757',
                  borderRadius: 10,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  marginRight: 6,
                }}>
                  <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>HOT</Text>
                </View>
                <Entypo name="chevron-right" size={20} color={colors.textSecondary} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Coffee Explorer Button */}
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, paddingVertical: 8, marginTop: 10 }]}
            onPress={() => router.push('/coffee-explorer')}
          >
            <View style={styles.rowCenter}>
              <View style={styles.socialRow}>
                <Ionicons name="cafe-outline" size={20} color="#8B5CF6" />
                <Text style={[styles.socialText, { color: colors.text }]}>
                  Khám phá cà phê
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  backgroundColor: '#8B5CF6',
                  borderRadius: 10,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  marginRight: 6,
                }}>
                  <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>NEW</Text>
                </View>
                <Entypo name="chevron-right" size={20} color={colors.textSecondary} />
              </View>
            </View>
          </TouchableOpacity>

          {/* News & Updates Button */}
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, paddingVertical: 8, marginTop: 10 }]}
            onPress={() => router.push('/news')}
          >
            <View style={styles.rowCenter}>
              <View style={styles.socialRow}>
                <Ionicons name="newspaper-outline" size={20} color="#10B981" />
                <Text style={[styles.socialText, { color: colors.text }]}>
                  Tin tức & Cập nhật
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  backgroundColor: '#10B981',
                  borderRadius: 10,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  marginRight: 6,
                }}>
                  <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>LIVE</Text>
                </View>
                <Entypo name="chevron-right" size={20} color={colors.textSecondary} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Face ID Setup Button */}
          {user && (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.card, paddingVertical: 8, marginTop: 10 }]}
              onPress={handleFaceIdSetup}
            >
              <View style={styles.rowCenter}>
                <View style={styles.socialRow}>
                  <Ionicons name="scan-outline" size={20} color={isFaceIdEnabled ? "#10B981" : "#C67C4E"} />
                  <Text style={[styles.socialText, { color: colors.text }]}>
                    Thiết lập Face ID (Khóa khuôn mặt)
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{
                    color: isFaceIdEnabled ? "#10B981" : colors.textSecondary,
                    fontSize: 12,
                    fontFamily: 'Sora-SemiBold',
                    marginRight: 6,
                  }}>
                    {isFaceIdEnabled ? "Đang bật" : "Chưa kích hoạt"}
                  </Text>
                  <Entypo name="chevron-right" size={20} color={colors.textSecondary} />
                </View>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>{t('log_out')}</Text>
          </TouchableOpacity>

          {/* Face Scanner Modal Overlay */}
          <FaceScannerModal
            visible={scannerVisible}
            onClose={() => setScannerVisible(false)}
            onSuccess={handleFaceScanSuccess}
            title="Đăng ký nhận diện khuôn mặt (Face ID)"
          />
        </ScrollView>
      </PageTransition>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerButton: { padding: 8 },
  topBg: {
    height: 140,
    backgroundColor: "#C67C4E",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  avatarWrapper: {
    position: "absolute",
    top: 70,
    alignSelf: "center",
    zIndex: 5,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
  },
  infoContainer: {
    marginTop: 40,
    alignItems: "center",
  },
  name: { fontSize: 20, fontWeight: "600" },
  phone: { fontSize: 14, marginTop: 4 },
  roleBadge: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
  },
  adminBadge: { backgroundColor: '#FEF3C7' },
  userBadge: { backgroundColor: '#DBEAFE' },
  roleText: { fontSize: 12, fontWeight: '600' },
  adminText: { color: '#D97706' },
  userText: { color: '#2563EB' },
  card: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: "500" },
  rowCenter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  socialRow: { flexDirection: "row", alignItems: "center" },
  socialText: { fontSize: 14, marginLeft: 10 },
  langButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  langButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  themeButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  themeToggle: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  themeToggleLight: {
    backgroundColor: '#FFF',
    alignSelf: 'flex-start',
  },
  themeToggleDark: {
    backgroundColor: '#C67C4E',
    alignSelf: 'flex-end',
  },
  logoutBtn: {
    backgroundColor: "#C67C4E",
    paddingVertical: 12,
    marginHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
});
