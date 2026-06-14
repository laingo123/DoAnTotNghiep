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

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { t } = useLanguage();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirm.trim()) {
      Alert.alert(t('register_failed'), t('fill_all_fields'));
      return;
    }

    if (password !== confirm) {
      Alert.alert(t('register_failed'), t('password_mismatch'));
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      Alert.alert(t('register_success'), t('register_success_msg'));
      router.replace('/login');
    } catch (error: any) {
      if (error.message === 'EMAIL_EXISTS') {
        Alert.alert(t('register_failed'), t('email_exists'));
      } else {
        Alert.alert(t('register_failed'), t('register_failed_msg'));
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
              {t('sign_up_title')}
            </Text>

            <TextInput
              placeholder={t('full_name')}
              value={name}
              onChangeText={setName}
              className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
            />

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
              className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
            />

            <TextInput
              placeholder={t('confirm_password')}
              secureTextEntry
              value={confirm}
              onChangeText={setConfirm}
              className="border border-gray-300 rounded-lg px-4 py-3 mb-6"
            />

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              className={`bg-[#C57C3E] rounded-lg py-3 mb-4 items-center ${
                loading ? 'opacity-50' : ''
              }`}
            >
              <Text className="text-white text-lg font-[Sora-SemiBold]">
                {loading ? t('signing_up') : t('sign_up')}
              </Text>
            </TouchableOpacity>

            <View className="flex-row justify-center">
              <Text className="text-gray-600">{t('has_account')}</Text>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text className="text-[#C57C3E] font-[Sora-SemiBold]">{t('log_in')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      </PageTransition>
    </GestureHandlerRootView>
  );
}
