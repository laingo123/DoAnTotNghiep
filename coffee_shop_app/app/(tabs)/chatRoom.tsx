import { Alert, TouchableOpacity, View, Text } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import MessageList from '@/components/MessageList'
import { MessageInterface } from '@/types/types';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen'
import { GestureHandlerRootView, TextInput } from 'react-native-gesture-handler'
import { Feather } from '@expo/vector-icons'
import { callChatBotAPI } from '@/services/chatBot'
import PageHeader from '@/components/PageHeader'
import { useCart } from '@/components/CartContext'
import { useTheme } from '@/components/ThemeContext'
import PageTransition from '@/components/PageTransition'

const ChatRoom = () => {
    const { addToCart, emptyCart } = useCart();
    const { colors, isDark } = useTheme();

    const [messages, setMessages] = useState<MessageInterface[]>([]);
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const textRef = useRef('')
    const inputRef = useRef<TextInput>(null)

    useEffect(() => {
    }, [messages]);

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
            let responseMessage = await callChatBotAPI(InputMessages);
            if (responseMessage) {
                // Chỉ lưu tin nhắn phản hồi vào giao diện nếu API trả về dữ liệu hợp lệ
                setMessages(prevMessages => [...prevMessages, responseMessage]);
                if (responseMessage.memory) {
                    if (responseMessage.memory.order) {
                        emptyCart()
                        responseMessage.memory.order.forEach((item: any) => {
                            addToCart(item.item, item.quantity)
                        });
                    }
                }
            }


        } catch (err: any) {
            Alert.alert('Message', err.message)
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

                <PageHeader title="Chat Bot" showHeaderRight={false} bgColor={colors.surface} />

                <View style={{ height: 3, borderBottomWidth: 1, borderBottomColor: isDark ? colors.border : '#D4D4D4' }} />

                <View
                    style={{ flex: 1, justifyContent: 'space-between', backgroundColor: isDark ? colors.background : '#F5F5F5', overflow: 'visible' }}
                >
                    <View style={{ flex: 1 }}>
                        <MessageList
                            messages={messages}
                            isTyping={isTyping}
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
                                placeholder='Type message...'
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
