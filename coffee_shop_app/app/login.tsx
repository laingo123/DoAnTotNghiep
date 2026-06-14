import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { useAuth } from '@/components/AuthContext';
import { useLanguage } from '@/components/LanguageContext';
import PageTransition from '@/components/PageTransition';
import { Ionicons } from '@expo/vector-icons';
import FaceScannerModal from '@/components/FaceScannerModal';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const [scannerVisible, setScannerVisible] = useState(false);

  const handleFaceIdLogin = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedEmail = window.localStorage.getItem('coffee_shop_face_id_email');
      const savedPassword = window.localStorage.getItem('coffee_shop_face_id_password');

      if (!savedEmail || !savedPassword) {
        Alert.alert(
          "Chưa thiết lập",
          "Thiết bị này chưa đăng ký nhận diện khuôn mặt cho tài khoản nào. Vui lòng đăng nhập bằng mật khẩu trước và vào mục Cá nhân để kích hoạt Face ID."
        );
        return;
      }

      setScannerVisible(true);
    } else {
      Alert.alert("Không hỗ trợ", "Trình duyệt không hỗ trợ lưu trữ cục bộ.");
    }
  };

  const handleFaceScanSuccess = async () => {
    setScannerVisible(false);
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedEmail = window.localStorage.getItem('coffee_shop_face_id_email');
      const savedPassword = window.localStorage.getItem('coffee_shop_face_id_password');

      if (savedEmail && savedPassword) {
        setLoading(true);
        try {
          await login(savedEmail, savedPassword);
          router.replace('/(tabs)/home');
        } catch (error) {
          Alert.alert("Lỗi đăng nhập", "Không thể xác thực thông tin đăng nhập đã lưu.");
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('login_failed'), t('email_required'));
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      if (error.message === 'USER_NOT_FOUND') {
        Alert.alert(t('login_failed'), t('user_not_found'));
      } else if (error.message === 'WRONG_PASSWORD') {
        Alert.alert(t('login_failed'), t('wrong_password'));
      } else {
        Alert.alert(t('login_failed'), t('login_failed_msg'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <GestureHandlerRootView className="flex-1">
      <PageTransition>
      <SafeAreaView className="flex-1 bg-white px-6">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <Text className="text-3xl font-[Sora-SemiBold] text-gray-800 mb-8 text-center">
              {t('login')}
            </Text>

            <TextInput
              placeholder={t('email')}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
            />

            <TextInput
              placeholder={t('password')}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              className="border border-gray-300 rounded-lg px-4 py-3 mb-2"
            />

            <TouchableOpacity
              onPress={() => router.push('/forgot-password')}
              className="self-end mb-6"
            >
              <Text className="text-sm text-[#C57C3E]">{t('forgot_password')}</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                style={{
                  flex: 1,
                  backgroundColor: '#C57C3E',
                  borderRadius: 8,
                  height: 50,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                <Text style={{ color: 'white', fontSize: 16, fontFamily: 'Sora-SemiBold' }}>
                  {loading ? t('logging_in') : t('login')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleFaceIdLogin}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 8,
                  borderWidth: 1.5,
                  borderColor: '#C57C3E',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#FFF5F0',
                  marginLeft: 12,
                }}
              >
                <Ionicons name="scan" size={24} color="#C57C3E" />
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-center">
              <Text className="text-gray-600">{t('no_account')}</Text>
              <TouchableOpacity 
              onPress={() => router.push('/register')}>
                <Text className="text-[#C57C3E] font-[Sora-SemiBold]">{t('sign_up')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      </PageTransition>

      <FaceScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onSuccess={handleFaceScanSuccess}
        title="Đăng nhập bằng khuôn mặt (Face ID)"
      />
    </GestureHandlerRootView>
  );
}
