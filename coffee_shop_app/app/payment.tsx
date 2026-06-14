import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StatusBar, Alert, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import PageHeader from '@/components/PageHeader';
import { useRouter } from 'expo-router';
import { FontAwesome5, FontAwesome } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/components/CartContext';
import { useAuth } from '@/components/AuthContext';
import { useLanguage } from '@/components/LanguageContext';
import { saveOrder } from '@/services/orderService';
import { fetchProducts } from '@/services/productService';
import { Product } from '@/types/types';
import Toast from 'react-native-root-toast';
import PageTransition from '@/components/PageTransition';
import SimulatedMap from '@/components/SimulatedMap';

const PAYMENT_METHODS = [
  { id: 'wallet', label: 'Cash/Wallet', icon: <FontAwesome5 name="wallet" size={24} color="#C67C4E" /> },
  {
    id: 'momo',
    label: 'MoMo',
    icon: <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#A50064', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 10 }}>M</Text>
          </View>
  },
  {
    id: 'google',
    label: 'Google Pay',
    icon: <Image source={require('../assets/icons/gpay.png')} style={{ width: 24, height: 24, resizeMode: 'contain' }} />
  },
  {
    id: 'apple',
    label: 'Apple Pay',
    icon: <Image source={require('../assets/icons/applepay.png')} style={{ width: 24, height: 24, resizeMode: 'contain' }} />
  },
];


export default function Payment() {
  const [selected, setSelected] = useState<string>('wallet');
  const [paying, setPaying] = useState(false);
  const router = useRouter();
  const { cartItems, emptyCart } = useCart();
  const { user, walletBalance, spendWallet, addLoyaltyPoints } = useAuth();
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);

  // MoMo fields
  const [momoName, setMomoName] = useState('');
  const [momoPhone, setMomoPhone] = useState('');

  // Delivery fields
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');

  // Geolocation & Distance Estimation States
  const [locating, setLocating] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // Shop Coordinate: Dragon Bridge Da Nang
  const SHOP_COORDS = { latitude: 16.0594, longitude: 108.2198 };

  // Haversine Formula for road distance calculation
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Crow flies distance
    return d * 1.25; // Estimate actual road route distance by multiplying factor
  };

  // Reverse geocode via OSM Nominatim (free, keyless)
  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=vi`, {
        headers: {
          'User-Agent': 'CoffeeShopCustomerApp/1.0'
        }
      });
      const data = await response.json();
      if (data && data.display_name) {
        // Return a shorter version of the address if possible or full address
        return data.display_name;
      }
    } catch (err) {
      console.warn('Reverse geocoding failed, using coordinates fallback.', err);
    }
    return `Vị trí định vị (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
  };

  const applySimulatedLocation = () => {
    // Simulated near coordinate (Phước Ninh, Hải Châu, Đà Nẵng - about 1.8km from store)
    const simLat = 16.0650;
    const simLon = 108.2300;
    const dist = calculateDistance(SHOP_COORDS.latitude, SHOP_COORDS.longitude, simLat, simLon);
    const estDuration = Math.round(dist * 3 + 5);

    setUserCoords({ latitude: simLat, longitude: simLon });
    setDistance(dist);
    setDuration(estDuration);
    setDeliveryAddress('Cầu Rồng, Phước Ninh, Hải Châu, Đà Nẵng (Giả lập)');
    setLocating(false);
  };

  const handleLocate = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      Alert.alert('Không hỗ trợ', 'Trình duyệt/Thiết bị của bạn không hỗ trợ định vị GPS. Đang áp dụng vị trí giả lập.');
      applySimulatedLocation();
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let finalLat = latitude;
        let finalLon = longitude;

        let dist = calculateDistance(SHOP_COORDS.latitude, SHOP_COORDS.longitude, finalLat, finalLon);

        // Fallback to simulated location if user is testing from outside Da Nang (dist > 30km)
        if (dist > 30) {
          Alert.alert(
            'Chế độ mô phỏng',
            `Bạn đang ở khá xa cửa hàng (cách ${dist.toFixed(1)} km). Để hiển thị bản đồ sinh động, hệ thống đã giả lập vị trí của bạn cách quán 1.8 km.`
          );
          finalLat = 16.0650;
          finalLon = 108.2300;
          dist = calculateDistance(SHOP_COORDS.latitude, SHOP_COORDS.longitude, finalLat, finalLon);
        }

        const estDuration = Math.round(dist * 3 + 5);

        setUserCoords({ latitude: finalLat, longitude: finalLon });
        setDistance(dist);
        setDuration(estDuration);

        // Fetch address name
        const resolvedAddress = await reverseGeocode(finalLat, finalLon);
        setDeliveryAddress(resolvedAddress);
        setLocating(false);
        Toast.show('Định vị thành công!', { duration: Toast.durations.SHORT });
      },
      (error) => {
        console.warn('Geolocation error:', error);
        Alert.alert(
          'Không thể định vị',
          'Không thể truy cập GPS (có thể do quyền truy cập bị chặn). Hệ thống tự động chuyển sang vị trí giả lập.'
        );
        applySimulatedLocation();
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Promo and billing states
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [voucherLabel, setVoucherLabel] = useState('');

  useEffect(() => {
    fetchProducts().then(setProducts).catch(console.error);
  }, []);

  // Tính tổng tiền - hỗ trợ cả tên có size (vd: "Cappuccino (M)")
  useEffect(() => {
    const orderItems = Object.entries(cartItems)
      .filter(([_, quantity]) => quantity > 0);

    const total = orderItems.reduce((sum, [itemName, quantity]) => {
      // Thử tìm sản phẩm theo tên chính xác trước
      let product = products.find(p => p.name === itemName);
      // Nếu không tìm thấy, thử bỏ phần size "(S)", "(M)", "(L)"
      if (!product) {
        const baseName = itemName.replace(/\s*\([SML]\)\s*$/, '');
        product = products.find(p => p.name === baseName);
      }
      return sum + (product ? product.price * quantity : 0);
    }, 0);

    setTotalPrice(total);
  }, [cartItems, products]);

  // Re-calculate discount when totalPrice or voucher changes
  useEffect(() => {
    if (voucherLabel === 'SUMMER25') {
      setDiscount(totalPrice * 0.25);
    } else if (voucherLabel === 'WEEKEND') {
      setDiscount(totalPrice * 0.15);
    } else {
      setDiscount(0);
    }
  }, [totalPrice, voucherLabel]);

  const applyPromo = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode === 'SUMMER25') {
      setVoucherLabel('SUMMER25');
      Toast.show('Áp dụng thành công SUMMER25 (-25%)!', { duration: Toast.durations.SHORT });
    } else if (cleanCode === 'WEEKEND') {
      setVoucherLabel('WEEKEND');
      Toast.show('Áp dụng thành công WEEKEND (-15%)!', { duration: Toast.durations.SHORT });
    } else {
      Alert.alert('Không hợp lệ', 'Mã giảm giá không chính xác.');
    }
  };

  const removePromo = () => {
    setVoucherLabel('');
    setDiscount(0);
    setPromoCode('');
  };

  const showVouchers = () => {
    Alert.alert(
      'Mã Khuyến Mãi Của Bạn',
      'Chọn một voucher để áp dụng cho đơn hàng:',
      [
        { text: 'SUMMER25 (Giảm 25%)', onPress: () => applyPromo('SUMMER25') },
        { text: 'WEEKEND (Giảm 15%)', onPress: () => applyPromo('WEEKEND') },
        { text: 'Hủy', style: 'cancel' }
      ]
    );
  };

  const deliveryFee = deliveryType === 'delivery' ? 2.00 : 0.00;
  const finalPayTotal = Math.max(0, totalPrice - discount + deliveryFee);

  const formatVND = (usd: number) => {
    const vnd = Math.round(usd * 25000);
    return vnd.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const onPay = async () => {
    const orderItems = Object.entries(cartItems)
      .filter(([_, quantity]) => quantity > 0)
      .map(([name, quantity]) => ({ name, quantity }));

    if (orderItems.length === 0) {
      Alert.alert('Giỏ hàng trống', 'Vui lòng thêm sản phẩm vào giỏ hàng.');
      return;
    }

    // Validate delivery info
    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập địa chỉ giao hàng.');
      return;
    }
    if (!deliveryPhone.trim() || deliveryPhone.trim().length < 10) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số điện thoại hợp lệ.');
      return;
    }

    // Validate MoMo fields
    if (selected === 'momo') {
      if (!momoName.trim()) {
        Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên tài khoản MoMo.');
        return;
      }
      if (!momoPhone.trim() || momoPhone.trim().length < 10) {
        Alert.alert('Thiếu thông tin', 'Vui lòng nhập số điện thoại MoMo hợp lệ.');
        return;
      }
    }

    // Wallet balance validation
    if (selected === 'wallet') {
      if (walletBalance < finalPayTotal) {
        Alert.alert('Số dư không đủ', 'Ví của bạn không đủ tiền thanh toán. Vui lòng vào mục Cá nhân để nạp thêm ví hoặc dùng hình thức thanh toán khác.');
        return;
      }
    }

    setPaying(true);
    try {
      // Deduct wallet if using wallet payment
      if (selected === 'wallet') {
        const spent = spendWallet(finalPayTotal);
        if (!spent) {
          Alert.alert('Lỗi', 'Thao tác trừ tiền ví thất bại.');
          setPaying(false);
          return;
        }
      }

      const paymentLabel = selected === 'momo'
        ? `MoMo - ${momoName.trim()} (${momoPhone.trim()})`
        : selected === 'wallet'
        ? 'Ví điện tử'
        : PAYMENT_METHODS.find(m => m.id === selected)?.label || selected;

      const orderId = await saveOrder({
        items: orderItems,
        totalPrice: finalPayTotal,
        paymentMethod: paymentLabel,
        createdAt: new Date().toISOString(),
        status: 'pending',
        userEmail: user?.email || '',
        deliveryType: deliveryType,
        deliveryAddress: deliveryType === 'delivery' ? deliveryAddress.trim() : 'Nhận tại quán',
        deliveryPhone: deliveryPhone.trim(),
        deliveryNote: deliveryNote.trim() + (voucherLabel ? ` (Voucher: ${voucherLabel})` : ''),
        distance: deliveryType === 'delivery' && distance !== null ? distance : undefined,
        duration: deliveryType === 'delivery' && duration !== null ? duration : undefined,
        userCoords: deliveryType === 'delivery' && userCoords !== null ? userCoords : undefined,
      });

      // Reward points calculation: $1 = 10 points
      const earnedPoints = Math.round(finalPayTotal * 10);
      addLoyaltyPoints(earnedPoints);

      emptyCart();

      Toast.show(t('order_success') + ` (+${earnedPoints} điểm)`, {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });

      router.push({
        pathname: '/thankyou',
        params: { orderId }
      });
    } catch (error) {
      console.error('Error saving order:', error);
      Alert.alert(t('order_error'), t('order_error_msg'));
    } finally {
      setPaying(false);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: 'white' }}>
      <PageTransition>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <PageHeader title={t('payments')} showHeaderRight={false} bgColor="white" />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Credit Card Preview */}
        <View className="mx-6 mt-4 rounded-2xl bg-gray-900 p-5">
          <View className="flex-row justify-between items-center mb-6">
            <FontAwesome name="cc-visa" size={32} color="white" />
            <Text className="text-white text-lg">VISA</Text>
          </View>
          <Text className="text-white text-2xl font-mono mb-4">3897 8923 6745 4638</Text>
          <View className="flex-row justify-between">
            <View>
              <Text className="text-gray-400 text-xs">{t('card_holder')}</Text>
              <Text className="text-white text-base font-semibold">{user?.name || 'Guest'}</Text>
            </View>
            <View>
              <Text className="text-gray-400 text-xs">{t('expiry')}</Text>
              <Text className="text-white text-base font-semibold">01/30</Text>
            </View>
          </View>
        </View>

        {/* Delivery Section */}
        <View style={{ marginHorizontal: 24, marginTop: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 }}>🚚 Hình thức nhận hàng</Text>
          
          <View style={{ flexDirection: 'row', marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => setDeliveryType('delivery')}
              style={{
                flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginRight: 8,
                backgroundColor: deliveryType === 'delivery' ? '#C67C4E' : '#F0F0F0',
              }}
            >
              <Ionicons name="bicycle-outline" size={20} color={deliveryType === 'delivery' ? '#FFF' : '#666'} />
              <Text style={{ color: deliveryType === 'delivery' ? '#FFF' : '#666', fontWeight: '600', fontSize: 13, marginTop: 4 }}>Giao hàng</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setDeliveryType('pickup')}
              style={{
                flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginLeft: 8,
                backgroundColor: deliveryType === 'pickup' ? '#C67C4E' : '#F0F0F0',
              }}
            >
              <Ionicons name="storefront-outline" size={20} color={deliveryType === 'pickup' ? '#FFF' : '#666'} />
              <Text style={{ color: deliveryType === 'pickup' ? '#FFF' : '#666', fontWeight: '600', fontSize: 13, marginTop: 4 }}>Nhận tại quán</Text>
            </TouchableOpacity>
          </View>

          {deliveryType === 'delivery' && (
            <>
              <Text style={{ color: '#555', fontSize: 13, marginBottom: 6, fontWeight: '600' }}>Địa chỉ giao hàng</Text>
              <TextInput
                placeholder="Ví dụ: 123 Nguyễn Văn Linh, Đà Nẵng"
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                style={{
                  backgroundColor: '#F8F8F8', borderWidth: 1, borderColor: '#E0E0E0',
                  borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, marginBottom: 14,
                }}
              />
              <TouchableOpacity
                onPress={handleLocate}
                disabled={locating}
                style={{
                  backgroundColor: '#FFF',
                  borderColor: '#C67C4E',
                  borderWidth: 1,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  marginBottom: 14,
                }}
              >
                {locating ? (
                  <ActivityIndicator size="small" color="#C67C4E" style={{ marginRight: 8 }} />
                ) : (
                  <Ionicons name="location-outline" size={18} color="#C67C4E" style={{ marginRight: 6 }} />
                )}
                <Text style={{ color: '#C67C4E', fontWeight: 'bold', fontSize: 13 }}>
                  {locating ? 'Đang xác định vị trí...' : '📍 Định vị vị trí & Tính khoảng cách'}
                </Text>
              </TouchableOpacity>

              {distance !== null && duration !== null && (
                <View style={{ marginBottom: 14 }}>
                  <SimulatedMap
                    distance={distance}
                    duration={duration}
                    isDark={false}
                    isTracking={false}
                  />
                </View>
              )}
            </>
          )}

          <Text style={{ color: '#555', fontSize: 13, marginBottom: 6, fontWeight: '600' }}>Số điện thoại liên hệ</Text>
          <TextInput
            placeholder="Ví dụ: 0901234567"
            value={deliveryPhone}
            onChangeText={setDeliveryPhone}
            keyboardType="phone-pad"
            maxLength={11}
            style={{
              backgroundColor: '#F8F8F8', borderWidth: 1, borderColor: '#E0E0E0',
              borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, marginBottom: 14,
            }}
          />

          <Text style={{ color: '#555', fontSize: 13, marginBottom: 6, fontWeight: '600' }}>Ghi chú (tùy chọn)</Text>
          <TextInput
            placeholder="Ví dụ: Ít đường, thêm đá..."
            value={deliveryNote}
            onChangeText={setDeliveryNote}
            multiline
            numberOfLines={2}
            style={{
              backgroundColor: '#F8F8F8', borderWidth: 1, borderColor: '#E0E0E0',
              borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, marginBottom: 4,
              textAlignVertical: 'top', minHeight: 60,
            }}
          />
        </View>

        {/* List of Methods */}
        <View className="mt-6 mx-6 space-y-4">
          {PAYMENT_METHODS.map((m) => {
            const isActive = selected === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                className={`flex-row items-center justify-between px-4 py-3 rounded-xl border ${isActive ? 'border-app_orange_color bg-app_orange_color/10' : 'border-gray-200'
                  }`}
                onPress={() => setSelected(m.id)}
              >
                <View className="flex-row items-center">
                  {m.icon}
                  <Text className="ml-3 text-base font-semibold text-gray-800">
                    {m.label}
                  </Text>
                </View>
                {isActive && <FontAwesome name="check" size={20} color="#C67C4E" />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* MoMo Form */}
        {selected === 'momo' && (
          <View style={{ marginHorizontal: 24, marginTop: 20 }}>
            {/* MoMo Header */}
            <View style={{ backgroundColor: '#A50064', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text style={{ color: '#A50064', fontWeight: 'bold', fontSize: 16 }}>M</Text>
              </View>
              <View>
                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Thanh toán MoMo</Text>
                <Text style={{ color: '#FFB8D9', fontSize: 12 }}>Nhập thông tin ví MoMo</Text>
              </View>
            </View>

            {/* Form */}
            <View style={{ backgroundColor: '#FFF0F5', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, padding: 20 }}>
              <Text style={{ color: '#555', fontSize: 13, marginBottom: 6, fontWeight: '600' }}>Tên tài khoản MoMo</Text>
              <TextInput
                placeholder="Ví dụ: Nguyen Van A"
                value={momoName}
                onChangeText={setMomoName}
                style={{
                  backgroundColor: 'white',
                  borderWidth: 1,
                  borderColor: '#E0C0D0',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 15,
                  marginBottom: 14,
                }}
              />

              <Text style={{ color: '#555', fontSize: 13, marginBottom: 6, fontWeight: '600' }}>Số điện thoại MoMo</Text>
              <TextInput
                placeholder="Ví dụ: 0901234567"
                value={momoPhone}
                onChangeText={setMomoPhone}
                keyboardType="phone-pad"
                maxLength={11}
                style={{
                  backgroundColor: 'white',
                  borderWidth: 1,
                  borderColor: '#E0C0D0',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 15,
                  marginBottom: 14,
                }}
              />

              {/* MoMo Tổng tiền */}
              <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E0C0D0' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ color: '#888', fontSize: 14 }}>Tổng (USD):</Text>
                  <Text style={{ fontWeight: '600', fontSize: 14, color: '#C67C4E' }}>${finalPayTotal.toFixed(2)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#888', fontSize: 14 }}>Tổng (VND):</Text>
                  <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#A50064' }}>{formatVND(finalPayTotal)}đ</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Promo code area */}
        <View style={{ marginHorizontal: 24, marginTop: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 }}>🎫 Mã giảm giá / Ưu đãi</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              placeholder="Nhập mã (SUMMER25, WEEKEND...)"
              value={promoCode}
              onChangeText={setPromoCode}
              style={{
                flex: 1,
                backgroundColor: '#F8F8F8',
                borderWidth: 1,
                borderColor: '#E0E0E0',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 15,
                marginRight: 8,
              }}
            />
            <TouchableOpacity
              onPress={() => applyPromo(promoCode)}
              style={{
                backgroundColor: '#C67C4E',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>Áp dụng</Text>
            </TouchableOpacity>
          </View>

          {/* Quick select or active voucher tag */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            {voucherLabel ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#10B98115', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
                <Ionicons name="pricetag" size={12} color="#10B981" />
                <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '600', marginLeft: 6 }}>{voucherLabel} đã áp dụng</Text>
                <TouchableOpacity onPress={removePromo} style={{ marginLeft: 8 }}>
                  <Ionicons name="close-circle" size={16} color="#10B981" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={showVouchers}>
                <Text style={{ color: '#C67C4E', fontSize: 13, fontWeight: '600' }}>⚡ Xem danh sách ưu đãi của bạn</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Billing Receipt Details */}
        <View style={{ marginHorizontal: 24, marginTop: 24, backgroundColor: '#F9F9F9', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EEE' }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 12 }}>📋 Chi tiết thanh toán</Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#666', fontSize: 14 }}>Tạm tính</Text>
            <Text style={{ color: '#333', fontSize: 14, fontWeight: '600' }}>${totalPrice.toFixed(2)}</Text>
          </View>

          {discount > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#10B981', fontSize: 14 }}>Giảm giá</Text>
              <Text style={{ color: '#10B981', fontSize: 14, fontWeight: '600' }}>-${discount.toFixed(2)}</Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#666', fontSize: 14 }}>Phí giao hàng</Text>
            <Text style={{ color: '#333', fontSize: 14, fontWeight: '600' }}>${deliveryFee.toFixed(2)}</Text>
          </View>

          <View style={{ height: 1, backgroundColor: '#EEE', marginVertical: 10 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ color: '#333', fontSize: 15, fontWeight: '700' }}>Tổng thanh toán (USD)</Text>
            <Text style={{ color: '#C67C4E', fontSize: 18, fontWeight: 'bold' }}>${finalPayTotal.toFixed(2)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#666', fontSize: 12 }}>Tổng thanh toán (VND)</Text>
            <Text style={{ color: '#888', fontSize: 14, fontWeight: '700' }}>~{formatVND(finalPayTotal)}đ</Text>
          </View>

          {selected === 'wallet' && (
            <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#666', fontSize: 13 }}>Số dư ví hiện tại</Text>
              <Text style={{
                color: walletBalance >= finalPayTotal ? '#10B981' : '#EF4444',
                fontSize: 14,
                fontWeight: 'bold',
              }}>
                ${walletBalance.toFixed(2)} {walletBalance < finalPayTotal ? '(Không đủ tiền)' : '(Hợp lệ)'}
              </Text>
            </View>
          )}
        </View>

        {/* Pay Button - nằm trong ScrollView để luôn thấy */}
        <View style={{ marginHorizontal: 24, marginTop: 24 }}>
          <TouchableOpacity
            style={{
              backgroundColor: paying ? '#999' : selected === 'momo' ? '#A50064' : '#C67C4E',
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
            }}
            onPress={onPay}
            disabled={paying}
          >
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
              {paying
                ? t('processing')
                : selected === 'momo'
                  ? `💜 Thanh toán MoMo - ${formatVND(finalPayTotal)}đ`
                  : selected === 'wallet'
                    ? `💳 Thanh toán qua Ví - ${formatVND(finalPayTotal)}đ`
                    : `${t('pay_with')} ${PAYMENT_METHODS.find((m) => m.id === selected)?.label} - ${formatVND(finalPayTotal)}đ`}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
      </PageTransition>
    </GestureHandlerRootView>
  );
}
