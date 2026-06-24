import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StatusBar, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, Entypo } from '@expo/vector-icons';
import { useAuth } from '@/components/AuthContext';
import { useTheme } from '@/components/ThemeContext';
import { useLanguage } from '@/components/LanguageContext';
import { fetchOrdersByUser, OrderWithId } from '@/services/orderService';
import PageTransition from '@/components/PageTransition';
import { formatVNDFromUSD } from '@/utils/currency';

const STATUS_CONFIG: { [key: string]: { label: string; color: string; icon: string; bg: string } } = {
  pending: { label: 'Đang chờ', color: '#F59E0B', icon: 'time-outline', bg: '#FEF3C7' },
  confirmed: { label: 'Đã xác nhận', color: '#3B82F6', icon: 'checkmark-circle-outline', bg: '#DBEAFE' },
  preparing: { label: 'Đang pha', color: '#8B5CF6', icon: 'cafe-outline', bg: '#EDE9FE' },
  completed: { label: 'Hoàn thành', color: '#10B981', icon: 'checkmark-done-outline', bg: '#D1FAE5' },
  cancelled: { label: 'Đã hủy', color: '#EF4444', icon: 'close-circle-outline', bg: '#FEE2E2' },
};

export default function OrderHistory() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<OrderWithId[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    if (!user?.id && !user?.email) return;
    setLoading(true);
    try {
      const data = await fetchOrdersByUser(user?.id || '', user?.email);
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} - ${hours}:${mins}`;
  };

  const renderOrder = ({ item }: { item: OrderWithId }) => {
    const itemsText = item.items?.map(i => `${i.name || i.product_id} x${i.quantity}`).join(', ') || '';

    return (
      <View style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}>
        {/* Header: Order ID */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: 'Sora-Regular' }}>
            #{item.id.slice(-6).toUpperCase()}
          </Text>
        </View>

        {/* Items */}
        <Text style={{ color: colors.text, fontSize: 15, fontFamily: 'Sora-SemiBold', marginBottom: 4 }} numberOfLines={2}>
          {itemsText}
        </Text>

        {/* Date + Price + Payment */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 4, fontFamily: 'Sora-Regular' }}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
          <Text style={{ color: '#C67C4E', fontSize: 16, fontFamily: 'Sora-SemiBold' }}>
            {formatVNDFromUSD(item.totalPrice || 0)}
          </Text>
        </View>

        {/* Payment method */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <Ionicons name="card-outline" size={14} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 4, fontFamily: 'Sora-Regular' }}>
            {item.paymentMethod}
          </Text>
        </View>

        {/* Delivery info */}
        {item.deliveryAddress && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 4, fontFamily: 'Sora-Regular' }} numberOfLines={1}>
              {item.deliveryAddress}
            </Text>
          </View>
        )}
        {item.deliveryNote ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Ionicons name="chatbubble-outline" size={12} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 11, marginLeft: 4, fontStyle: 'italic', fontFamily: 'Sora-Regular' }} numberOfLines={1}>
              {item.deliveryNote}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PageTransition>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.surface} />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Entypo name="chevron-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontFamily: 'Sora-SemiBold', color: colors.text }}>
            Lịch sử đơn hàng
          </Text>
          <TouchableOpacity onPress={loadOrders} style={{ padding: 4 }}>
            <Ionicons name="refresh" size={22} color="#C67C4E" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#C67C4E" />
            <Text style={{ color: colors.textSecondary, marginTop: 12, fontFamily: 'Sora-Regular' }}>
              Đang tải...
            </Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="receipt-outline" size={64} color={colors.border} />
            <Text style={{ color: colors.textSecondary, fontSize: 16, marginTop: 16, fontFamily: 'Sora-Regular' }}>
              Chưa có đơn hàng nào
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/home')}
              style={{ backgroundColor: '#C67C4E', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 16 }}
            >
              <Text style={{ color: '#FFF', fontFamily: 'Sora-SemiBold', fontSize: 14 }}>Đặt món ngay</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={orders}
            renderItem={renderOrder}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
      </PageTransition>
    </GestureHandlerRootView>
  );
}
