import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Alert, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCart } from './CartContext';
import { useAuth } from './AuthContext';
import { saveOrder } from '@/services/orderService';
import { Product } from '@/types/types';
import ProductImage from './ProductImage';

interface VoiceOrderModalProps {
  visible: boolean;
  onClose: () => void;
  products: Product[];
}

export default function VoiceOrderModal({
  visible,
  onClose,
  products,
}: VoiceOrderModalProps) {
  if (!visible) return null;

  const router = useRouter();
  const { emptyCart } = useCart();
  const { user, walletBalance, spendWallet, addLoyaltyPoints } = useAuth();

  const [listening, setListening] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'confirming' | 'ordering' | 'success' | 'retry'>('idle');
  const [manualText, setManualText] = useState('');
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true);

  // Parsed items state for 1-tap confirmation
  const [matchedItems, setMatchedItems] = useState<{ product_id: string; name: string; quantity: number; price: number }[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);

  const [barHeights, setBarHeights] = useState([10, 10, 10, 10, 10]);
  const recognitionRef = useRef<any>(null);

  // Extract top 3 suggested products for display
  const suggestedProducts = products.slice(0, 3);

  // Text-To-Speech (TTS) Voice Feedback
  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      
      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find(v => v.lang.includes('vi'));
      if (viVoice) {
        utterance.voice = viVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // Soundwave animation effect
  useEffect(() => {
    if (listening) {
      const interval = setInterval(() => {
        setBarHeights([
          Math.floor(Math.random() * 25) + 10,
          Math.floor(Math.random() * 40) + 15,
          Math.floor(Math.random() * 20) + 10,
          Math.floor(Math.random() * 45) + 15,
          Math.floor(Math.random() * 30) + 10,
        ]);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setBarHeights([10, 10, 10, 10, 10]);
    }
  }, [listening]);

  // Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setHasSpeechSupport(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.lang = 'vi-VN';
    rec.interimResults = false;

    rec.onstart = () => {
      setListening(true);
      setStatus('listening');
      setTranscription('Đang nghe...');
    };

    rec.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setListening(false);
      setStatus('retry');
      if (event.error === 'not-allowed') {
        setTranscription('Lỗi: Trình duyệt chặn quyền truy cập Micro. Hãy cấp quyền trong cài đặt trình duyệt.');
      } else if (event.error === 'no-speech') {
        setTranscription('Không nghe thấy giọng nói. Hãy nói lại.');
      } else {
        setTranscription(`Lỗi micro: ${event.error}. Xin hãy thử lại.`);
      }
    };

    rec.onend = () => {
      setListening(false);
      setStatus(prev => prev === 'listening' ? 'retry' : prev);
    };

    rec.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      setTranscription(resultText);
      processVoiceCommand(resultText);
    };

    recognitionRef.current = rec;

    // Welcome greeting
    setTimeout(() => {
      speakText('Xin chào! Bạn muốn đặt món nước gì? Bạn có thể nói hoặc chọn đồ uống được đề xuất bên dưới.');
    }, 300);

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        setManualText('');
        setMatchedItems([]);
        setTotalPrice(0);
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Start listening failed:', e);
      }
    }
  };

  const parseNumberWord = (word: string): number => {
    const numMap: { [key: string]: number } = {
      'một': 1, '1': 1, 'mụt': 1, 'cốc': 1, 'ly': 1, 'chai': 1, 'phần': 1,
      'hai': 2, '2': 2,
      'ba': 3, '3': 3,
      'bốn': 4, '4': 4, 'tư': 4,
      'năm': 5, '5': 5,
      'sáu': 6, '6': 6,
      'bảy': 7, '7': 7, 'bẩy': 7,
      'tám': 8, '8': 8,
      'chín': 9, '9': 9,
      'mười': 10, '10': 10
    };
    return numMap[word.toLowerCase()] || 1;
  };

  const processVoiceCommand = (command: string) => {
    setStatus('processing');
    const cmdLower = command.toLowerCase();
    const tempMatched: { product_id: string; name: string; quantity: number; price: number }[] = [];

    products.forEach(product => {
      const prodNameLower = product.name.toLowerCase();
      
      let isMatched = false;
      if (cmdLower.includes(prodNameLower)) {
        isMatched = true;
      } else if (prodNameLower === 'cà phê sữa đá') {
        if (cmdLower.includes('sữa đá') || cmdLower.includes('cafe sữa') || cmdLower.includes('cà phê sữa')) {
          isMatched = true;
        }
      } else if (prodNameLower === 'cold brew') {
        if (cmdLower.includes('côn biu') || cmdLower.includes('công biu') || cmdLower.includes('cổn biu')) {
          isMatched = true;
        }
      }

      if (isMatched) {
        let qty = 1;
        const index = cmdLower.indexOf(prodNameLower) !== -1 
          ? cmdLower.indexOf(prodNameLower) 
          : cmdLower.indexOf('sữa đá') !== -1 
          ? cmdLower.indexOf('sữa đá')
          : 0;

        const beforeText = cmdLower.substring(Math.max(0, index - 15), index);
        const matches = beforeText.match(/(\d+|một|hai|ba|bốn|năm|sáu|bảy|tám|chín|mười|cốc|ly)/g);
        if (matches && matches.length > 0) {
          const lastMatch = matches[matches.length - 1];
          qty = parseNumberWord(lastMatch);
        }
        tempMatched.push({ product_id: product.id, name: product.name, quantity: qty, price: product.price });
      }
    });

    if (tempMatched.length > 0) {
      const total = tempMatched.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      setMatchedItems(tempMatched);
      setTotalPrice(total);
      
      setStatus('confirming');
      speakText('Bạn muốn đặt món này một chạm, chắc chắn chứ?');
    } else {
      speakText('Tôi chưa nhận diện được đồ uống bạn yêu cầu. Xin hãy thử lại.');
      setStatus('retry');
    }
  };

  const handleConfirmOrder = async () => {
    setStatus('ordering');
    try {
      const orderItems = matchedItems.map(item => ({
        product_id: item.product_id,
        name: item.name,
        quantity: item.quantity,
        size: 'S',
        price: item.price,
      }));
      
      const useWallet = user && walletBalance >= totalPrice;
      if (useWallet) {
        const spent = spendWallet(totalPrice);
        if (!spent) {
          throw new Error('WALLET_DEDUCT_FAILED');
        }
      }

      const paymentLabel = useWallet ? 'Ví điện tử (Đặt qua giọng nói)' : 'Thanh toán khi nhận hàng (Đặt qua giọng nói)';

      await saveOrder({
        items: orderItems,
        totalPrice: totalPrice,
        paymentMethod: paymentLabel,
        createdAt: new Date().toISOString(),
        status: 'pending',
        user_id: user?.id || 'guest',
        deliveryType: 'delivery',
        deliveryAddress: user?.location || 'Vị trí hiện tại (Đặt qua giọng nói)',
        deliveryPhone: user?.phone || '0901234567',
        deliveryNote: 'Đặt hàng nhanh 1 chạm bằng giọng nói',
      });

      if (user) {
        const earnedPoints = Math.round(totalPrice * 10);
        addLoyaltyPoints(earnedPoints);
      }

      emptyCart();
      speakText('Đặt hàng thành công!');
      setStatus('success');

      setTimeout(() => {
        onClose();
        router.replace('/(tabs)/home');
      }, 2500);

    } catch (err) {
      console.error('Error placing voice order:', err);
      Alert.alert('Lỗi đặt hàng', 'Có lỗi xảy ra trong quá trình đặt hàng giọng nói.');
      setStatus('retry');
    }
  };

  const handleManualSubmit = () => {
    if (!manualText.trim()) return;
    setTranscription(manualText);
    processVoiceCommand(manualText);
  };

  const formatVND = (usd: number) => {
    const vnd = Math.round(usd * 25000);
    return new Intl.NumberFormat('vi-VN').format(vnd) + 'đ';
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.modalCard}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Trợ lý đặt hàng giọng nói</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#AAA" />
          </TouchableOpacity>
        </View>

        {/* Scrollable Modal Content */}
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
          
          {/* 1. Confirming Flow Layout */}
          {status === 'confirming' ? (
            <View style={styles.confirmBox}>
              <Ionicons name="cart-outline" size={36} color="#C67C4E" style={{ alignSelf: 'center', marginBottom: 12 }} />
              <Text style={styles.confirmTitle}>Bạn muốn đặt món này (1 chạm) chắc chắn chứ?</Text>
              
              <View style={styles.confirmList}>
                {matchedItems.map((item, idx) => (
                  <View key={idx} style={styles.confirmItemRow}>
                    <Text style={styles.confirmItemText}>• {item.name} x{item.quantity}</Text>
                    <Text style={styles.confirmItemPrice}>{formatVND(item.price * item.quantity)}</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.confirmTotalRow}>
                <Text style={styles.confirmTotalLabel}>Tổng cộng:</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.confirmTotalUsd}>{formatVND(totalPrice)}</Text>
                  <Text style={styles.confirmTotalVnd}>{formatVND(totalPrice)}</Text>
                </View>
              </View>

              <View style={styles.confirmActionRow}>
                <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => setStatus('idle')}>
                  <Text style={styles.confirmCancelText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmOkBtn} onPress={handleConfirmOrder}>
                  <Text style={styles.confirmOkText}>OK (Đặt hàng)</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* 2. Normal Scanning Flow Layout */
            <>
              <View style={styles.visualizerContainer}>
                {status === 'listening' ? (
                  <View style={styles.waveContainer}>
                    {barHeights.map((h, i) => (
                      <View
                        key={i}
                        style={[
                          styles.waveBar,
                          {
                            height: h,
                            backgroundColor: '#C67C4E',
                            marginTop: (50 - h) / 2,
                          },
                        ]}
                      />
                    ))}
                  </View>
                ) : status === 'processing' || status === 'ordering' ? (
                  <ActivityIndicator size="large" color="#C67C4E" />
                ) : status === 'success' ? (
                  <View style={styles.successIconBox}>
                    <Ionicons name="checkmark-circle" size={54} color="#10B981" />
                  </View>
                ) : (
                  <TouchableOpacity onPress={startListening} style={styles.micButton}>
                    <Ionicons name="mic" size={32} color="white" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.speechDisplay}>
                <Text style={styles.speechText}>
                  {transcription || 'Nhấn nút micro để nói hoặc chọn đồ uống được đề xuất bên dưới...'}
                </Text>
              </View>

              <View style={styles.statusBox}>
                {status === 'listening' && (
                  <Text style={styles.listeningText}>🎙️ Đang lắng nghe giọng nói...</Text>
                )}
                {status === 'ordering' && (
                  <Text style={styles.listeningText}>⚡ Đang tạo đơn hàng...</Text>
                )}
                {status === 'success' && (
                  <Text style={styles.successText}>🎉 Đặt món thành công! Đang chuyển trang...</Text>
                )}
                {status === 'retry' && (
                  <Text style={styles.retryText}>⚠️ Chưa nhận diện được. Bấm mic nói lại nhé!</Text>
                )}
              </View>

              {/* 3. NEW: Recommended Coffee Drinks Grid Section */}
              <View style={styles.suggestSection}>
                <Text style={styles.sectionTitle}>☕ Đồ uống được đề xuất</Text>
                <View style={styles.suggestGrid}>
                  {suggestedProducts.map((item) => (
                    <TouchableOpacity
                      key={item.name}
                      style={styles.suggestCard}
                      onPress={() => {
                        setTranscription(`Đặt 1 cốc ${item.name}`);
                        processVoiceCommand(`Đặt 1 cốc ${item.name}`);
                      }}
                    >
                      <ProductImage uri={item.image_url} style={styles.suggestImage} />
                      <View style={styles.suggestInfo}>
                        <Text style={styles.suggestName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.suggestPrice}>{formatVND(item.price)}</Text>
                      </View>
                      <Ionicons name="flash" size={14} color="#C67C4E" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 4. NEW: Voice Command Speech Bubble Suggestions */}
              <View style={styles.bubbleSection}>
                <Text style={styles.bubbleTitle}>🗣️ Mẫu câu gợi ý bạn có thể nói:</Text>
                <View style={styles.bubbleRow}>
                  {[
                    `Đặt 1 cốc ${suggestedProducts[0]?.name || 'Cappuccino'}`,
                    `Cho tôi 2 ly ${suggestedProducts[1]?.name || 'Latte'}`,
                  ].map((phrase, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.bubble}
                      onPress={() => {
                        setTranscription(phrase);
                        processVoiceCommand(phrase);
                      }}
                    >
                      <Text style={styles.bubbleText}>"{phrase}"</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Fallback Text Input */}
              <View style={styles.fallbackBox}>
                <Text style={styles.fallbackLabel}>Gõ nội dung gọi món nếu mic bị chặn:</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ví dụ: 1 cà phê sữa đá, 2 latte..."
                    placeholderTextColor="#666"
                    value={manualText}
                    onChangeText={setManualText}
                    onSubmitEditing={handleManualSubmit}
                  />
                  <TouchableOpacity onPress={handleManualSubmit} style={styles.sendBtn}>
                    <Ionicons name="send" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 10, 15, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalCard: {
    backgroundColor: '#1E1E24',
    width: 330,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3E3E4A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 15,
    fontFamily: 'Sora-Bold',
  },
  closeBtn: {
    padding: 4,
  },
  visualizerContainer: {
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  micButton: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#C67C4E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: 150,
    height: 50,
  },
  waveBar: {
    width: 4,
    marginHorizontal: 3,
    borderRadius: 2,
  },
  successIconBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  speechDisplay: {
    backgroundColor: '#262630',
    borderRadius: 14,
    padding: 12,
    minHeight: 50,
    justifyContent: 'center',
    marginBottom: 10,
  },
  speechText: {
    color: '#DDD',
    fontSize: 12,
    fontFamily: 'Sora-Regular',
    lineHeight: 16,
    textAlign: 'center',
  },
  statusBox: {
    alignItems: 'center',
    minHeight: 18,
    marginBottom: 14,
  },
  listeningText: {
    color: '#3B82F6',
    fontSize: 11,
    fontFamily: 'Sora-SemiBold',
  },
  successText: {
    color: '#10B981',
    fontSize: 11,
    fontFamily: 'Sora-SemiBold',
  },
  retryText: {
    color: '#EF4444',
    fontSize: 11,
    fontFamily: 'Sora-SemiBold',
  },
  
  // Recommended Drinks styles
  suggestSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: 'Sora-Bold',
    marginBottom: 8,
  },
  suggestGrid: {
    gap: 8,
  },
  suggestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262630',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#2D2D3B',
  },
  suggestImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  suggestInfo: {
    flex: 1,
    marginLeft: 10,
  },
  suggestName: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Sora-SemiBold',
  },
  suggestPrice: {
    color: '#C67C4E',
    fontSize: 11,
    fontFamily: 'Sora-Bold',
    marginTop: 2,
  },

  // Command speech bubbles styles
  bubbleSection: {
    marginBottom: 16,
  },
  bubbleTitle: {
    color: '#888',
    fontSize: 11,
    fontFamily: 'Sora-Regular',
    marginBottom: 6,
  },
  bubbleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  bubble: {
    backgroundColor: '#37374A',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  bubbleText: {
    color: '#C67C4E',
    fontSize: 10.5,
    fontFamily: 'Sora-SemiBold',
  },

  fallbackBox: {
    borderTopWidth: 1,
    borderTopColor: '#2D2D3B',
    paddingTop: 12,
  },
  fallbackLabel: {
    color: '#888',
    fontSize: 10,
    fontFamily: 'Sora-Regular',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#262630',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
    color: 'white',
    marginRight: 8,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#C67C4E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // 1-tap confirmation box styles
  confirmBox: {
    paddingVertical: 10,
  },
  confirmTitle: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Sora-Bold',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  confirmList: {
    backgroundColor: '#262630',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  confirmItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  confirmItemText: {
    color: '#EEE',
    fontSize: 13,
    fontFamily: 'Sora-SemiBold',
  },
  confirmItemPrice: {
    color: '#AAA',
    fontSize: 13,
    fontFamily: 'Sora-Regular',
  },
  confirmTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2D2D3B',
    paddingTop: 12,
    marginBottom: 20,
  },
  confirmTotalLabel: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Sora-Bold',
  },
  confirmTotalUsd: {
    color: '#C67C4E',
    fontSize: 16,
    fontFamily: 'Sora-Bold',
  },
  confirmTotalVnd: {
    color: '#888',
    fontSize: 11,
    fontFamily: 'Sora-Regular',
    marginTop: 2,
  },
  confirmActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmCancelBtn: {
    flex: 1,
    backgroundColor: '#2D2D3B',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  confirmCancelText: {
    color: '#AAA',
    fontSize: 13,
    fontFamily: 'Sora-Bold',
  },
  confirmOkBtn: {
    flex: 1,
    backgroundColor: '#C67C4E',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  confirmOkText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: 'Sora-Bold',
  },
});
