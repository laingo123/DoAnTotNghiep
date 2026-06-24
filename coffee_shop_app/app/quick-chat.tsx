import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import PageHeader from '@/components/PageHeader';
import PageTransition from '@/components/PageTransition';
import { useTheme } from '@/components/ThemeContext';
import { fetchProducts } from '@/services/productService';
import { formatVNDFromUSD } from '@/utils/currency';
import { callGeminiChatAPI } from '@/services/geminiChat';
import { MessageInterface } from '@/types/types';
import { useCart } from '@/components/CartContext';

type QuickSuggestion = {
  name: string;
  price: number;
  category: string;
};

type ChatMessage = MessageInterface & { id: string };

const QuickChatPage = () => {
  const { addToCart } = useCart();
  const { colors, isDark } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'bot',
      content: 'Xin chào, đây là chat box mới. Bạn có thể thử nhắn trước để kiểm tra giao diện.',
    },
  ]);
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState<QuickSuggestion[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const products = await fetchProducts();
        setSuggestions(
          products
            .map((product) => ({
              name: product.name,
              price: Number(product.price) || 0,
              category: product.category || 'Món',
            }))
            .filter((product, index, self) =>
              index === self.findIndex((item) => item.name === product.name)
            )
        );
      } catch (error) {
        console.error('Failed to load quick chat suggestions:', error);
      }
    };

    loadSuggestions();
  }, []);

  const filteredSuggestions = text.trim()
    ? suggestions.filter((item) =>
        item.name.toLowerCase().includes(text.trim().toLowerCase())
      ).slice(0, 6)
    : suggestions.slice(0, 6);

  const handlePickSuggestion = (name: string) => {
    setText(name);
  };

  const handleOrderSuggestion = (item: QuickSuggestion) => {
    addToCart(item.name, 1);
    router.push('/(tabs)/order');
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setText('');
    setIsSending(true);

    try {
      const reply = await callGeminiChatAPI(
        [...messages, { role: 'user', content: trimmed }],
        suggestions
      );

      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-bot`,
          role: reply.role,
          content: reply.content,
        },
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Không kết nối được Gemini lúc này.';
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-bot-error`,
          role: 'assistant',
          content: `Gemini lỗi: ${errorMessage}`,
        },
      ]);
      console.error('Gemini chat error:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <PageTransition>
        <StatusBar backgroundColor={colors.surface} barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <PageHeader title="Chat Box Mới" showHeaderRight={false} bgColor={colors.surface} />

          <View
            style={{
              flex: 1,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 16,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isDark ? '#1F1F1F' : '#FFF3EC',
                borderRadius: 18,
                paddingHorizontal: 14,
                paddingVertical: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: isDark ? colors.border : '#F0D8C8',
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: '#C67C4E',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Feather name="message-circle" size={22} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontFamily: 'Sora-SemiBold', fontSize: 15 }}>Chat box thử nghiệm</Text>
                <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 12, marginTop: 2 }}>
                  Trang riêng, không dùng màn chat cũ
                </Text>
              </View>
              <Ionicons name="sparkles-outline" size={20} color="#C67C4E" />
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((message) => {
                const isUser = message.role === 'user';
                return (
                  <View
                    key={message.id}
                    style={{
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      backgroundColor: isUser ? '#C67C4E' : (isDark ? '#242424' : '#FFFFFF'),
                      borderRadius: 18,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      marginBottom: 10,
                      maxWidth: '84%',
                      borderWidth: isUser ? 0 : 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{ color: isUser ? 'white' : colors.text, fontSize: 14, fontFamily: 'Sora-Regular', lineHeight: 20 }}>
                      {message.content}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>

            {filteredSuggestions.length > 0 && (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: 'Sora-SemiBold', marginBottom: 8 }}>
                  Gợi ý món
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
                  {filteredSuggestions.map((item) => (
                    <TouchableOpacity
                      key={item.name}
                      onPress={() => handleOrderSuggestion(item)}
                      style={{
                        backgroundColor: isDark ? '#1F1F1F' : '#FFFFFF',
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 18,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        marginRight: 10,
                        minWidth: 140,
                      }}
                    >
                      <Text style={{ color: colors.text, fontFamily: 'Sora-SemiBold', fontSize: 13 }} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 11, marginTop: 4 }} numberOfLines={1}>
                        {item.category}
                      </Text>
                      <Text style={{ color: '#C67C4E', fontFamily: 'Sora-Bold', fontSize: 12, marginTop: 6 }}>
                        {formatVNDFromUSD(item.price)}
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 10, marginTop: 4 }}>
                        Chạm để thêm vào giỏ và mở Order
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.card,
                  borderRadius: 999,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Nhập tin nhắn..."
                  placeholderTextColor={colors.textSecondary}
                  style={{ flex: 1, color: colors.text, fontSize: 14, fontFamily: 'Sora-Regular', paddingVertical: 8 }}
                  multiline
                />
                <TouchableOpacity
                  onPress={handleSend}
                  disabled={isSending}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    backgroundColor: isSending ? '#D9A58A' : '#C67C4E',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: 10,
                  }}
                >
                  <Feather name={isSending ? 'loader' : 'send'} size={18} color="white" />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </PageTransition>
    </GestureHandlerRootView>
  );
};

export default QuickChatPage;
