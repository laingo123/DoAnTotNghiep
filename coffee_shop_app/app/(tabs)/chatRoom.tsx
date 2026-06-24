import { Alert, TouchableOpacity, View, Text } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import MessageList from '@/components/MessageList'
import { MessageInterface } from '@/types/types';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen'
import { GestureHandlerRootView, TextInput } from 'react-native-gesture-handler'
import { Feather } from '@expo/vector-icons'
import { callGeminiChatAPI } from '@/services/geminiChat'
import { fetchProducts } from '@/services/productService'
import PageHeader from '@/components/PageHeader'
import { useTheme } from '@/components/ThemeContext'
import PageTransition from '@/components/PageTransition'
import { Product } from '@/types/types'
import { useCart } from '@/components/CartContext'
import Toast from 'react-native-root-toast'

const ChatRoom = () => {
    const { colors, isDark } = useTheme();
    const { addToCart } = useCart();

    const [messages, setMessages] = useState<MessageInterface[]>([
        {
            role: 'assistant',
            content: 'Xin chào, mình là trợ lý Gemini của quán. Bạn muốn hỏi về menu, giá món hay cần gợi ý đồ uống hôm nay?',
        },
    ]);
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [products, setProducts] = useState<Product[]>([]);
    const textRef = useRef('')
    const inputRef = useRef<TextInput>(null)

    useEffect(() => {
        fetchProducts()
            .then(setProducts)
            .catch((error) => {
                console.error('Error loading products for Gemini chat:', error);
            });
    }, []);

    const containsOrderKeyword = (text: string) =>
        text.normalize('NFC').toLocaleLowerCase('vi-VN').includes('đặt');

    const handleSelectProduct = (product: Product, size: 'S' | 'M' | 'L') => {
        addToCart(`${product.name} (${size})`, 1);
        Toast.show(`Đã thêm ${product.name} (${size}) vào giỏ`, {
            duration: Toast.durations.SHORT,
        });
        setMessages((current) => [
            ...current,
            { role: 'user', content: `Chọn ${product.name} size ${size}` },
            { role: 'assistant', content: `Mình đã đặt 1 ${product.name} size ${size} vào giỏ cho bạn. Bạn có thể chọn size khác và đặt tiếp, hoặc bấm tab Order để kiểm tra và thanh toán nhé!` },
        ]);
    };

    const handleSendMessage = async () => {
        let message = textRef.current.trim();
        if (!message) return;
        try {

            // Add the user message to the list of messages
            // Lọc bỏ các tin nhắn bị null hoặc undefined trước khi gửi đi API
            let InputMessages = [...messages, { content: message, role: 'user' }].filter(msg => msg != null);

            setMessages(InputMessages);
            textRef.current = ''
            if (inputRef) inputRef?.current?.clear();
            setIsTyping(true)

            if (containsOrderKeyword(message)) {
                setMessages([
                    ...InputMessages,
                    {
                        role: 'assistant',
                        content: products.length
                            ? 'Bạn chọn món và size S, M hoặc L bên dưới nhé. Bấm “Đặt món” là mình thêm ngay vào giỏ.'
                            : 'Menu đang tải hoặc chưa có món. Bạn thử lại sau một chút nhé.',
                        products,
                    },
                ]);
                return;
            }

            let responseMessage = await callGeminiChatAPI(InputMessages, products);
            if (responseMessage) {
                // Chỉ lưu tin nhắn phản hồi vào giao diện nếu API trả về dữ liệu hợp lệ
                setMessages(prevMessages => [...prevMessages, responseMessage]);
            }


        } catch (err: any) {
            Alert.alert('Gemini', err.message || 'Không thể kết nối Gemini lúc này.')
        } finally {
            setIsTyping(false)
        }

    }

    return (
        <GestureHandlerRootView>
            <PageTransition>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            <View
                style={{ flex: 1, backgroundColor: colors.surface }}
            >

                <PageHeader title="Gemini Chat" showHeaderRight={false} bgColor={colors.surface} />

                <View style={{ height: 3, borderBottomWidth: 1, borderBottomColor: isDark ? colors.border : '#D4D4D4' }} />

                <View
                    style={{ flex: 1, justifyContent: 'space-between', backgroundColor: isDark ? colors.background : '#F5F5F5', overflow: 'visible' }}
                >
                    <View style={{ flex: 1 }}>
                        <MessageList
                            messages={messages}
                            isTyping={isTyping}
                            onSelectProduct={handleSelectProduct}
                        />
                    </View>

                    <View
                        style={{ marginBottom: hp(2.7), paddingTop: 8 }}
                    >
                        <View
                            style={{
                                flexDirection: 'row', marginHorizontal: 12, justifyContent: 'space-between',
                                borderWidth: 1, padding: 8, borderRadius: 999, paddingLeft: 20,
                                backgroundColor: colors.card, borderColor: isDark ? colors.border : '#D4D4D4',
                            }}
                        >
                            <TextInput
                                ref={inputRef}
                                onChangeText={value => textRef.current = value}
                                placeholder='Nhập tin nhắn cho Gemini...'
                                placeholderTextColor={colors.textSecondary}
                                style={{ fontSize: hp(2), flex: 1, marginRight: 8, color: colors.text }}
                            />
                            <TouchableOpacity
                                onPress={handleSendMessage}
                                style={{ backgroundColor: isDark ? '#444' : '#E5E5E5', padding: 8, marginRight: 1, borderRadius: 999 }}
                            >
                                <Feather name="send" size={hp(2.7)} color={isDark ? '#C67C4E' : '#737373'} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>



            </View>
            </PageTransition>
        </GestureHandlerRootView>
    )
}

export default ChatRoom
