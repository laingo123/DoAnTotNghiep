import { Text, View, TouchableOpacity, ScrollView, StatusBar, TextInput, Alert, ActivityIndicator, Linking, Clipboard, Platform } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router } from 'expo-router'
import { useLocalSearchParams } from "expo-router";
import PageHeader from '@/components/PageHeader';
import { useCart } from '@/components/CartContext';
import { useAuth } from '@/components/AuthContext';
import { useTheme } from '@/components/ThemeContext';
import Toast from 'react-native-root-toast';
import DescriptionSection from '@/components/DescriptionSection';
import SizesSection from '@/components/SizesSection';
import DetailsHeader from '@/components/DetailsHeader';
import { useLanguage } from '@/components/LanguageContext';
import { useFavorites } from '@/components/FavoritesContext';
import { saveReview, fetchReviewsByProduct, ReviewWithId } from '@/services/reviewService';
import { AntDesign, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import PageTransition from '@/components/PageTransition';

const DetailsPage = () => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [sizeExtra, setSizeExtra] = useState(0);
  const [selectedSize, setSelectedSize] = useState('S');

  // Review state
  const [reviews, setReviews] = useState<ReviewWithId[]>([]);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Share state
  const [showShare, setShowShare] = useState(false);

  const { name, image_url, type, description, price, rating } = useLocalSearchParams() as { name: string, image_url: string, type: string, description: string, price: string, rating: string };

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/details?name=${encodeURIComponent(name)}&image_url=${encodeURIComponent(image_url || '')}&type=${encodeURIComponent(type || '')}&description=${encodeURIComponent(description || '')}&price=${encodeURIComponent(price || '')}&rating=${encodeURIComponent(rating || '')}`
    : `https://coffeeshop.com/details?name=${encodeURIComponent(name)}`;

  const basePrice = Number(price);
  const finalPrice = (basePrice + sizeExtra).toFixed(1);

  // Load reviews
  const loadReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const data = await fetchReviewsByProduct(name);
      setReviews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReviews(false);
    }
  }, [name]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Average rating
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : rating;

  const handleSizeChange = (size: string, priceMultiplier: number) => {
    setSelectedSize(size);
    setSizeExtra(priceMultiplier);
  };

  const buyNow = () => {
    addToCart(`${name} (${selectedSize})`, 1);
    Toast.show(`${name} (${selectedSize}) ${t('added_to_cart')}`, {
      duration: Toast.durations.SHORT,
    });
    router.push('/payment');
  };

  const submitReview = async () => {
    if (myRating === 0) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn số sao.');
      return;
    }
    if (!myComment.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng viết nhận xét.');
      return;
    }
    setSubmitting(true);
    try {
      await saveReview({
        productName: name,
        userEmail: user?.email || '',
        userName: user?.name || 'Guest',
        rating: myRating,
        comment: myComment.trim(),
        createdAt: new Date().toISOString(),
      });
      setMyRating(0);
      setMyComment('');
      Toast.show('Đánh giá thành công! ⭐', { duration: Toast.durations.SHORT });
      loadReviews();
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể gửi đánh giá.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
  };

  const StarRow = ({ rating: r, size = 16, onPress }: { rating: number, size?: number, onPress?: (i: number) => void }) => (
    <View style={{ flexDirection: 'row' }}>
      {[1,2,3,4,5].map(i => (
        <TouchableOpacity key={i} onPress={() => onPress?.(i)} disabled={!onPress} style={{ marginRight: 2 }}>
          <AntDesign name={i <= r ? 'star' : 'staro'} size={size} color={i <= r ? '#FFB800' : '#CCC'} />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <GestureHandlerRootView
      style={{ backgroundColor: colors.background, width: '100%', height: '100%' }}
    >
      <PageTransition>
      <StatusBar backgroundColor={colors.surface} />

      <PageHeader title={t('detail')} showHeaderRight={false} bgColor={colors.background} />

      <View style={{ height: '100%', flexDirection: 'column', justifyContent: 'space-between' }}>
        <ScrollView>
            <View style={{ marginHorizontal: 20, alignItems: 'center' }}>
              <DetailsHeader image_url={image_url} name={name} type={type} rating={Number(avgRating)} />
              
              {/* Share button */}
              <TouchableOpacity
                onPress={() => setShowShare(true)}
                style={{
                  position: 'absolute', top: 12, right: 50,
                  backgroundColor: isDark ? '#333' : '#F0F0F0',
                  borderRadius: 20, padding: 8,
                }}
              >
                <Ionicons name="share-social-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Favorite button */}
              <TouchableOpacity
                onPress={() => toggleFavorite(name)}
                style={{
                  position: 'absolute', top: 12, right: 0,
                  backgroundColor: isFavorite(name) ? '#FFE0E6' : (isDark ? '#333' : '#F0F0F0'),
                  borderRadius: 20, padding: 8,
                }}
              >
                <AntDesign name={isFavorite(name) ? 'heart' : 'hearto'} size={20} color={isFavorite(name) ? '#FF4757' : colors.textSecondary} />
              </TouchableOpacity>

              <DescriptionSection description={description} />
              <SizesSection onSizeChange={handleSizeChange} />
            </View>

            {/* Reviews Section */}
            <View style={{ marginHorizontal: 20, marginTop: 24, marginBottom: 120 }}>
              <Text style={{ fontSize: 18, fontFamily: 'Sora-SemiBold', color: colors.text, marginBottom: 16 }}>
                ⭐ Đánh giá ({reviews.length})
              </Text>

              {/* Write Review */}
              <View style={{
                backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16,
                shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
              }}>
                <Text style={{ color: colors.text, fontFamily: 'Sora-SemiBold', fontSize: 14, marginBottom: 10 }}>
                  Viết đánh giá
                </Text>
                <StarRow rating={myRating} size={28} onPress={(i) => setMyRating(i)} />
                <TextInput
                  placeholder="Chia sẻ trải nghiệm của bạn..."
                  placeholderTextColor={colors.textSecondary}
                  value={myComment}
                  onChangeText={setMyComment}
                  multiline
                  numberOfLines={3}
                  style={{
                    backgroundColor: isDark ? '#333' : '#F8F8F8',
                    borderRadius: 12, padding: 12, marginTop: 12, fontSize: 14,
                    color: colors.text, textAlignVertical: 'top', minHeight: 70,
                    borderWidth: 1, borderColor: colors.border,
                  }}
                />
                <TouchableOpacity
                  onPress={submitReview}
                  disabled={submitting}
                  style={{
                    backgroundColor: submitting ? '#999' : '#C67C4E',
                    borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12,
                  }}
                >
                  <Text style={{ color: 'white', fontFamily: 'Sora-SemiBold', fontSize: 14 }}>
                    {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Reviews List */}
              {loadingReviews ? (
                <ActivityIndicator size="small" color="#C67C4E" />
              ) : reviews.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Ionicons name="chatbubble-outline" size={32} color={colors.border} />
                  <Text style={{ color: colors.textSecondary, marginTop: 8, fontFamily: 'Sora-Regular' }}>
                    Chưa có đánh giá nào
                  </Text>
                </View>
              ) : (
                reviews.map((review) => (
                  <View key={review.id} style={{
                    backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10,
                    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{
                          width: 32, height: 32, borderRadius: 16,
                          backgroundColor: '#C67C4E', alignItems: 'center', justifyContent: 'center', marginRight: 8,
                        }}>
                          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>
                            {(review.userName || 'G')[0].toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text style={{ color: colors.text, fontFamily: 'Sora-SemiBold', fontSize: 13 }}>
                            {review.userName}
                          </Text>
                          <StarRow rating={review.rating} size={12} />
                        </View>
                      </View>
                      <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                        {formatDate(review.createdAt)}
                      </Text>
                    </View>
                    <Text style={{ color: colors.text, fontSize: 13, fontFamily: 'Sora-Regular', lineHeight: 20 }}>
                      {review.comment}
                    </Text>
                  </View>
                ))
              )}
            </View>
        </ScrollView>

        <View
          style={{
            flexDirection: 'row', justifyContent: 'space-between',
            backgroundColor: colors.card,
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24,
            position: 'absolute', bottom: 0, left: 0, right: 0,
            shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 10,
          }}
        >
          <View>
            <Text
                    style={{ color: colors.textSecondary, fontSize: 16, fontFamily: 'Sora-Regular', paddingBottom: 4 }}
              >{t('price')}
            </Text>
            <Text
                    style={{ color: '#C67C4E', fontSize: 24, fontFamily: 'Sora-SemiBold' }}
              >$ {finalPrice}
            </Text>
          </View>

          <TouchableOpacity
                style={{ backgroundColor: '#C67C4E', width: '70%', borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}
                onPress = {buyNow}
              >
                <Text style={{ fontSize: 20, color: 'white', fontFamily: 'Sora-Regular' }}>{t('buy_now')}</Text>
          </TouchableOpacity>

        </View>

      </View>

      {/* Share Bottom Sheet Modal */}
      {showShare && (
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={() => setShowShare(false)} 
          style={{
            position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
            justifyContent: 'flex-end',
          }}
        >
          {/* Bottom Sheet Container */}
          <TouchableOpacity 
            activeOpacity={1} 
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: 24, paddingBottom: 40,
              borderWidth: 1, borderColor: colors.border,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: colors.text, fontSize: 18, fontFamily: 'Sora-Bold' }}>Chia sẻ sản phẩm</Text>
              <TouchableOpacity onPress={() => setShowShare(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Product Card Preview */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#2A2A2A' : '#F9F9F9',
              borderRadius: 16, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: colors.border,
            }}>
              <Image source={{ uri: image_url }} style={{ width: 50, height: 50, borderRadius: 10 }} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 14, fontFamily: 'Sora-SemiBold' }}>{name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: 'Sora-Regular', marginTop: 2 }}>{type}</Text>
              </View>
              <Text style={{ color: '#C67C4E', fontSize: 15, fontFamily: 'Sora-Bold' }}>${price}</Text>
            </View>

            {/* Sharing Channels Grid */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap' }}>
              {/* Facebook */}
              <TouchableOpacity 
                onPress={() => {
                  Linking.openURL(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);
                  setShowShare(false);
                }}
                style={{ alignItems: 'center', width: '22%' }}
              >
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#1877F2', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <FontAwesome5 name="facebook-f" size={20} color="white" />
                </View>
                <Text style={{ color: colors.text, fontSize: 11, fontFamily: 'Sora-Regular' }}>Facebook</Text>
              </TouchableOpacity>

              {/* Zalo */}
              <TouchableOpacity 
                onPress={() => {
                  Linking.openURL(`https://zalo.me/share?url=${encodeURIComponent(shareUrl)}`);
                  setShowShare(false);
                }}
                style={{ alignItems: 'center', width: '22%' }}
              >
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#0068FF', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>Zalo</Text>
                </View>
                <Text style={{ color: colors.text, fontSize: 11, fontFamily: 'Sora-Regular' }}>Zalo</Text>
              </TouchableOpacity>

              {/* Messenger */}
              <TouchableOpacity 
                onPress={() => {
                  Clipboard.setString(shareUrl);
                  Toast.show('Đã sao chép liên kết! Hãy gửi cho bạn bè qua Messenger 💬', { duration: Toast.durations.SHORT });
                  setShowShare(false);
                }}
                style={{ alignItems: 'center', width: '22%' }}
              >
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#00B2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <FontAwesome5 name="facebook-messenger" size={20} color="white" />
                </View>
                <Text style={{ color: colors.text, fontSize: 11, fontFamily: 'Sora-Regular' }}>Messenger</Text>
              </TouchableOpacity>

              {/* SMS */}
              <TouchableOpacity 
                onPress={() => {
                  const smsBody = `Hãy thử món ${name} cực ngon tại Coffee Shop nhé! Link sản phẩm: ${shareUrl}`;
                  Linking.openURL(`sms:?body=${encodeURIComponent(smsBody)}`);
                  setShowShare(false);
                }}
                style={{ alignItems: 'center', width: '22%' }}
              >
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FF9500', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Ionicons name="chatbubble-ellipses" size={22} color="white" />
                </View>
                <Text style={{ color: colors.text, fontSize: 11, fontFamily: 'Sora-Regular' }}>SMS</Text>
              </TouchableOpacity>
            </View>

            {/* Direct Copy Link Button */}
            <TouchableOpacity 
              onPress={() => {
                Clipboard.setString(shareUrl);
                Toast.show('Đã sao chép liên kết thành công!', { duration: Toast.durations.SHORT });
                setShowShare(false);
              }}
              style={{
                backgroundColor: isDark ? '#333' : '#F5F5F5',
                borderRadius: 14, paddingVertical: 14,
                alignItems: 'center', marginTop: 24,
                borderWidth: 1, borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 13, fontFamily: 'Sora-Bold' }}>Sao chép liên kết</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      </PageTransition>
    </GestureHandlerRootView>
  )
}

export default DetailsPage