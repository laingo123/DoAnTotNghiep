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
import { useLanguage } from '@/components/LanguageContext';
import PageTransition from '@/components/PageTransition';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleReset = async () => {
    setLoading(true);
    try {
      // TODO: Add your reset logic (e.g. Firebase Auth sendPasswordResetEmail)
      Alert.alert(t('reset_success'), t('reset_success_msg'));
      router.replace('/login');
    } catch (err) {
      console.error(err);
      Alert.alert(t('reset_failed'), t('reset_failed_msg'));
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
              {t('forgot_password_title')}
            </Text>

            <TextInput
              placeholder={t('your_email')}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              className="border border-gray-300 rounded-lg px-4 py-3 mb-6"
            />

            <TouchableOpacity
              onPress={handleReset}
              disabled={loading}
              className={`bg-[#C57C3E] rounded-lg py-3 mb-4 items-center ${
                loading ? 'opacity-50' : ''
              }`}
            >
              <Text className="text-white text-lg font-[Sora-SemiBold]">
                {loading ? t('sending') : t('send_reset')}
              </Text>
            </TouchableOpacity>

            <View className="flex-row justify-center">
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text className="text-[#C57C3E] font-[Sora-SemiBold]">{t('back_to_login')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      </PageTransition>
    </GestureHandlerRootView>
  );
}
