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
  Modal,
  Platform,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/components/AuthContext";
import { useLanguage } from "@/components/LanguageContext";
import { useTheme } from "@/components/ThemeContext";
import PageTransition from "@/components/PageTransition";
import { LinearGradient } from "expo-linear-gradient";
import FaceScannerModal from "@/components/FaceScannerModal";
import { formatVNDFromUSD } from "@/utils/currency";

export default function Profile() {
  const router = useRouter();
  const { user, isAdmin, logout, walletBalance, loyaltyPoints, topUpWallet, updateProfile } = useAuth();
  const { language, t, toggleLanguage } = useLanguage();
  const { colors, isDark, toggleTheme } = useTheme();

  const [isFaceIdEnabled, setIsFaceIdEnabled] = React.useState(false);
  const [scannerVisible, setScannerVisible] = React.useState(false);
  const [profileModalVisible, setProfileModalVisible] = React.useState(false);
  const [topUpModalVisible, setTopUpModalVisible] = React.useState(false);
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [guestProfile, setGuestProfile] = React.useState<any | null>(null);
  const [profileForm, setProfileForm] = React.useState({
    name: '',
    phone: '',
    gender: '',
    birthday: '',
    location: '',
    avatarUrl: '',
  });

  const effectiveProfile = {
    name: guestProfile?.name || user?.name || 'Guest',
    phone: guestProfile?.phone || user?.phone || '',
    gender: guestProfile?.gender || user?.gender || t('male'),
    birthday: guestProfile?.birthday || user?.birthday || '09 Dec 2004',
    location: guestProfile?.location || user?.location || 'Da Nang',
    avatarUrl: guestProfile?.avatarUrl || user?.avatarUrl || '',
  };

  React.useEffect(() => {
    if (user?.email && typeof window !== 'undefined' && window.localStorage) {
      const val = window.localStorage.getItem(`${user.email}_face_id_enabled`);
      setIsFaceIdEnabled(val === 'true');
    }
  }, [user]);

  React.useEffect(() => {
    if (!user && typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('coffee_shop_guest_profile');
      setGuestProfile(saved ? JSON.parse(saved) : null);
    } else {
      setGuestProfile(null);
    }
  }, [user]);

  const openEditProfile = () => {
    setProfileForm({
      name: effectiveProfile.name,
      phone: effectiveProfile.phone,
      gender: effectiveProfile.gender,
      birthday: effectiveProfile.birthday,
      location: effectiveProfile.location,
      avatarUrl: effectiveProfile.avatarUrl,
    });
    setProfileModalVisible(true);
  };

  const updateProfileField = (field: keyof typeof profileForm, value: string) => {
    setProfileForm(current => ({ ...current, [field]: value }));
  };

  const readAvatarFile = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const rawDataUrl = String(reader.result || '');
        const img = new window.Image();

        img.onload = () => {
          const maxSize = 500;
          const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));

          const context = canvas.getContext('2d');
          if (!context) {
            resolve(rawDataUrl);
            return;
          }

          context.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };

        img.onerror = () => resolve(rawDataUrl);
        img.src = rawDataUrl;
      };

      reader.onerror = () => reject(new Error('READ_FILE_FAILED'));
      reader.readAsDataURL(file);
    });

  const pickAvatarFromComputer = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      Alert.alert('Chưa hỗ trợ', 'Chọn ảnh đại diện từ file hiện hỗ trợ trên bản web.');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp,image/gif';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        Alert.alert('File không hợp lệ', 'Vui lòng chọn file ảnh.');
        return;
      }

      try {
        const dataUrl = await readAvatarFile(file);
        updateProfileField('avatarUrl', dataUrl);
      } catch (error) {
        console.error('Error reading avatar:', error);
        Alert.alert('Lỗi', 'Không thể đọc ảnh đại diện. Vui lòng thử ảnh khác.');
      }
    };
    input.click();
  };

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên hiển thị.');
      return;
    }

    const nextProfile = {
      name: profileForm.name.trim(),
      phone: profileForm.phone.trim(),
      gender: profileForm.gender.trim(),
      birthday: profileForm.birthday.trim(),
      location: profileForm.location.trim(),
      avatarUrl: profileForm.avatarUrl.trim(),
    };

    setSavingProfile(true);
    try {
      if (user?.id) {
        await updateProfile(nextProfile);
      } else if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('coffee_shop_guest_profile', JSON.stringify(nextProfile));
        setGuestProfile(nextProfile);
      }

      setProfileModalVisible(false);
      Alert.alert('Thành công', 'Đã cập nhật thông tin cá nhân.');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Lỗi', 'Không thể lưu thông tin cá nhân. Vui lòng thử lại.');
    } finally {
      setSavingProfile(false);
    }
  };

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
    setTopUpModalVisible(true);
  };

  const handleTopUpAmount = (amount: number) => {
    topUpWallet(amount);
    setTopUpModalVisible(false);
    Alert.alert("Thành công", `Đã nạp ${formatVNDFromUSD(amount)} vào ví!`);
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
              onPress={openEditProfile}
              style={styles.headerButton}
            >
              <Entypo name="pencil" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Top Background */}
          <View style={styles.topBg} />

          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            <TouchableOpacity onPress={openEditProfile} activeOpacity={0.85}>
              <Image
                source={effectiveProfile.avatarUrl ? { uri: effectiveProfile.avatarUrl } : require("../../assets/images/avatar.jpg")}
                style={[styles.avatar, { borderColor: colors.background }]}
              />
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={16} color="#FFF" />
              </View>
            </TouchableOpacity>
          </View>

          {/* User Info */}
          <View style={styles.infoContainer}>
            <Text style={[styles.name, { color: colors.text }]}>{effectiveProfile.name}</Text>
            <Text style={[styles.phone, { color: colors.textSecondary }]}>{effectiveProfile.phone || user?.email || ''}</Text>
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
                <Text style={{ color: '#FFF', fontSize: 16, fontFamily: 'Sora-SemiBold' }}>{effectiveProfile.name}</Text>
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
                  <FontAwesome5 name="wallet" size={20} color="#C67C4E" />
                </View>
                <View>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: 'Sora-Regular' }}>Ví điện tử của tôi</Text>
                  <Text style={{ color: colors.text, fontSize: 18, fontFamily: 'Sora-Bold', marginTop: 2 }}>
                    {formatVNDFromUSD(walletBalance)}
                    <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 'normal' }}>
                      {' '}(~{formatVNDFromUSD(walletBalance)})
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
              ['Số điện thoại', effectiveProfile.phone || 'Chưa cập nhật'],
              [t('gender'), effectiveProfile.gender],
              [t('birthday'), effectiveProfile.birthday],
              [t('location'), effectiveProfile.location],
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

          <Modal
            visible={topUpModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setTopUpModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.topUpModal, { backgroundColor: colors.background }]}>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Nạp tiền ví</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                      Số dư hiện tại: {formatVNDFromUSD(walletBalance)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setTopUpModalVisible(false)} style={{ padding: 6 }}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {[
                  { amount: 10, label: 'Nạp 250.000đ', sub: 'Gói demo nhanh' },
                  { amount: 20, label: 'Nạp 500.000đ', sub: 'Phù hợp đặt nhiều món' },
                  { amount: 50, label: 'Nạp 1.250.000đ', sub: 'Số dư thoải mái để demo' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.amount}
                    onPress={() => handleTopUpAmount(option.amount)}
                    style={[styles.topUpOption, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={styles.topUpIcon}>
                      <FontAwesome5 name="wallet" size={17} color="#C67C4E" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>{option.label}</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 3 }}>{option.sub}</Text>
                    </View>
                    <Ionicons name="add-circle" size={24} color="#C67C4E" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Modal>

          <Modal
            visible={profileModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => !savingProfile && setProfileModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.profileModal, { backgroundColor: colors.background }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Chỉnh sửa hồ sơ</Text>
                  <TouchableOpacity
                    onPress={() => !savingProfile && setProfileModalVisible(false)}
                    style={{ padding: 6 }}
                  >
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
                  <View style={{ alignItems: 'center', marginBottom: 18 }}>
                    <Image
                      source={profileForm.avatarUrl ? { uri: profileForm.avatarUrl } : require("../../assets/images/avatar.jpg")}
                      style={[styles.modalAvatar, { borderColor: colors.border }]}
                    />
                    <TouchableOpacity onPress={pickAvatarFromComputer} style={styles.pickAvatarButton}>
                      <Ionicons name="cloud-upload-outline" size={17} color="#FFF" />
                      <Text style={styles.pickAvatarText}>Chọn ảnh từ máy tính</Text>
                    </TouchableOpacity>
                  </View>

                  {[
                    { key: 'name', label: 'Tên hiển thị', placeholder: 'Ví dụ: Nguyễn Hoàng Nam' },
                    { key: 'phone', label: 'Số điện thoại', placeholder: 'Ví dụ: 0901234567', keyboardType: 'phone-pad' },
                    { key: 'gender', label: 'Giới tính', placeholder: 'Ví dụ: Nam / Nữ' },
                    { key: 'birthday', label: 'Ngày sinh', placeholder: 'Ví dụ: 09 Dec 2004' },
                    { key: 'location', label: 'Địa điểm', placeholder: 'Ví dụ: Đà Nẵng' },
                  ].map((field) => (
                    <View key={field.key} style={{ marginBottom: 12 }}>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{field.label}</Text>
                      <TextInput
                        value={profileForm[field.key as keyof typeof profileForm]}
                        onChangeText={(value) => updateProfileField(field.key as keyof typeof profileForm, value)}
                        placeholder={field.placeholder}
                        placeholderTextColor={colors.textSecondary}
                        keyboardType={field.keyboardType as any}
                        style={[
                          styles.profileInput,
                          {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            color: colors.text,
                          },
                        ]}
                      />
                    </View>
                  ))}

                  <TouchableOpacity
                    onPress={handleSaveProfile}
                    disabled={savingProfile}
                    style={[styles.saveProfileButton, { opacity: savingProfile ? 0.65 : 1 }]}
                  >
                    <Text style={styles.saveProfileText}>
                      {savingProfile ? 'Đang lưu...' : 'Lưu thông tin'}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>

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
  avatarEditBadge: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#C67C4E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  profileModal: {
    maxHeight: "92%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  topUpModal: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalAvatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    marginBottom: 12,
  },
  pickAvatarButton: {
    backgroundColor: "#C67C4E",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  pickAvatarText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 7,
  },
  profileInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  saveProfileButton: {
    backgroundColor: "#C67C4E",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
  },
  saveProfileText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  topUpOption: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  topUpIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#C67C4E20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
});
