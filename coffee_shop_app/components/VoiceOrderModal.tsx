import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ActivityIndicator, Image, ScrollView } from 'react-native';
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
  const router = useRouter();
  const { emptyCart } = useCart();
  const { user, walletBalance, spendWallet, addLoyaltyPoints } = useAuth();

  const [manualText, setManualText] = useState('');
  const [transcription, setTranscription] = useState('');
  const [status, setStatus] = useState<'idle' | 'confirming' | 'ordering' | 'success' | 'retry'>('idle');
  const [matchedItems, setMatchedItems] = useState<{ product_id: string; name: string; quantity: number; price: number }[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);

  // Extract top 3 suggested products for display
  const suggestedProducts = products.slice(0, 3);

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
          qty = parseNumberWord(matches[matches.length - 1]);
        }
        tempMatched.push({ product_id: product.id, name: product.name, quantity: qty, price: product.price });
      }
    });

    if (tempMatched.length > 0) {
      const total = tempMatched.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      setMatchedItems(tempMatched);
      setTotalPrice(total);
      setStatus('confirming');
    } else {
      setStatus('retry');
    }
  };

  const handleManualSubmit = () => {
    if (!manualText.trim()) return;
    setTranscription(manualText);
    processVoiceCommand(manualText);
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
      setStatus('success');

      setTimeout(() => {
        onClose();
        router.replace('/(tabs)/home');
      }, 1500);

    } catch (err) {
      console.error('Error placing voice order:', err);
      Alert.alert('Lỗi đặt hàng', 'Có lỗi xảy ra trong quá trình đặt hàng nhanh.');
      setStatus('retry');
    }
  };

  const formatVND = (usd: number) => {
    const vnd = Math.round(usd * 25000);
    return new Intl.NumberFormat('vi-VN').format(vnd) + 'đ';
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Trợ lý đặt hàng nhanh</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#AAA" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
            {status === 'confirming' ? (
              <View style={styles.confirmBox}>
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
                    <Text style={styles.confirmOkText}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.desc}>
                  🎙️ Trợ lý giọng nói khả dụng trên trình duyệt web. Nhấn nút mic trên bàn phím điện thoại hoặc chọn gợi ý bên dưới để đặt hàng nhanh!
                </Text>

                {/* Recommended Drinks Grid */}
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

                {/* Suggestions Speech Bubbles */}
                <View style={styles.bubbleSection}>
                  <Text style={styles.bubbleTitle}>🗣️ Mẫu câu gợi ý:</Text>
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

                {transcription ? (
                  <View style={styles.speechDisplay}>
                    <Text style={styles.speechText}>"{transcription}"</Text>
                  </View>
                ) : null}

                <View style={styles.inputBox}>
                  <Text style={styles.label}>Nhấn nút Micro trên bàn phím để đọc lệnh gọi món:</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Ví dụ: 1 Latte, 2 Cappuccino..."
                      placeholderTextColor="#666"
                      value={manualText}
                      onChangeText={setManualText}
                      autoFocus={true}
                    />
                    <TouchableOpacity onPress={handleManualSubmit} style={styles.sendBtn}>
                      <Ionicons name="send" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                  
                  {status === 'ordering' && (
                    <ActivityIndicator size="small" color="#C67C4E" style={{ marginTop: 12 }} />
                  )}
                  {status === 'success' && <Text style={styles.success}>✓ Đã tạo đơn. Đang chuyển trang...</Text>}
                  {status === 'retry' && <Text style={styles.retry}>⚠️ Không nhận diện được món nước. Thử lại nhé!</Text>}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#1E1E24',
    padding: 20,
    borderRadius: 24,
    width: 330,
    borderWidth: 1,
    borderColor: '#3E3E4A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: 'Sora-Bold',
    color: '#FFF',
  },
  closeBtn: {
    padding: 4,
  },
  desc: {
    color: '#AAA',
    fontSize: 12,
    fontFamily: 'Sora-Regular',
    marginBottom: 16,
    lineHeight: 16,
  },
  inputBox: {
    borderTopWidth: 1,
    borderTopColor: '#2D2D3B',
    paddingTop: 12,
    marginTop: 12,
  },
  label: {
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
    color: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    fontSize: 13,
    marginRight: 8,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#C67C4E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  success: {
    color: '#10B981',
    fontSize: 12,
    fontFamily: 'Sora-SemiBold',
    marginTop: 8,
    textAlign: 'center',
  },
  retry: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: 'Sora-SemiBold',
    marginTop: 8,
    textAlign: 'center',
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

  speechDisplay: {
    backgroundColor: '#262630',
    borderRadius: 10,
    padding: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  speechText: {
    color: '#C67C4E',
    fontSize: 12,
    fontFamily: 'Sora-SemiBold',
  },
  
  // Confirmation screen styles
  confirmBox: {
    paddingVertical: 4,
  },
  confirmTitle: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Sora-Bold',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  confirmList: {
    backgroundColor: '#262630',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  confirmItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  confirmItemText: {
    color: '#EEE',
    fontSize: 13,
    fontFamily: 'Sora-SemiBold',
  },
  confirmItemPrice: {
    color: '#AAA',
    fontSize: 13,
  },
  confirmTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2D2D3B',
    paddingTop: 10,
    marginBottom: 16,
  },
  confirmTotalLabel: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: 'Sora-Bold',
  },
  confirmTotalUsd: {
    color: '#C67C4E',
    fontSize: 15,
    fontFamily: 'Sora-Bold',
  },
  confirmTotalVnd: {
    color: '#888',
    fontSize: 10,
    marginTop: 1,
  },
  confirmActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmCancelBtn: {
    flex: 1,
    backgroundColor: '#2D2D3B',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 6,
  },
  confirmCancelText: {
    color: '#AAA',
    fontSize: 13,
    fontFamily: 'Sora-Bold',
  },
  confirmOkBtn: {
    flex: 1,
    backgroundColor: '#C67C4E',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginLeft: 6,
  },
  confirmOkText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: 'Sora-Bold',
  },
});
