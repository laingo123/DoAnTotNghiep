import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { ref, get } from 'firebase/database';
import PageHeader from '@/components/PageHeader';
import PageTransition from '@/components/PageTransition';
import ProductImage from '@/components/ProductImage';
import { useTheme } from '@/components/ThemeContext';
import { fireBaseDB } from '@/config/firebaseConfig';
import { addProduct, deleteProduct, fetchProducts, ProductInput, updateProduct } from '@/services/productService';
import { Product } from '@/types/types';
import { CustomerData, fetchCustomers, setCustomerBlocked } from '@/services/customerService';

const EXCHANGE_RATE = 25000;

type AdminTab = 'orders' | 'products' | 'customers' | 'analytics';
type RevenuePeriod = 'hour' | 'day' | 'week' | 'month';

interface OrderData {
  id: string;
  items?: { product_id?: string; name?: string; quantity: number; size?: string; price?: number }[];
  totalPrice: number;
  paymentMethod: string;
  createdAt: string;
  status: string;
  deliveryAddress?: string;
  user_id?: string;
  userEmail?: string;
}

type ProductFormState = {
  name: string;
  category: string;
  description: string;
  image_url: string;
  priceVnd: string;
  rating: string;
};

const emptyProductForm: ProductFormState = {
  name: '',
  category: '',
  description: '',
  image_url: '',
  priceVnd: '',
  rating: '4.5',
};

const vndFormatter = new Intl.NumberFormat('vi-VN');

const formatVNDFromUSD = (usd: number) => `${vndFormatter.format(Math.round((Number(usd) || 0) * EXCHANGE_RATE))}đ`;

const parseMoneyInput = (value: string) => Number(value.replace(/[^\d]/g, ''));

const toPriceInput = (usd: number) => String(Math.round((Number(usd) || 0) * EXCHANGE_RATE));

const normalizeSearchValue = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .trim();

const startOfDay = (date: Date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date: Date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const startOfWeek = (date: Date) => {
  const result = startOfDay(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const getPeriodRange = (period: RevenuePeriod, baseDate = new Date()) => {
  const start =
    period === 'hour'
      ? new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), baseDate.getHours(), 0, 0, 0)
      : period === 'day'
      ? startOfDay(baseDate)
      : period === 'week'
        ? startOfWeek(baseDate)
        : startOfMonth(baseDate);

  const end =
    period === 'hour'
      ? new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), baseDate.getHours(), 59, 59, 999)
      : period === 'day'
      ? endOfDay(baseDate)
      : period === 'week'
        ? endOfDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6))
        : endOfDay(new Date(start.getFullYear(), start.getMonth() + 1, 0));

  return { start, end };
};

const getPeriodTitle = (period: RevenuePeriod, start: Date, end: Date) => {
  if (period === 'hour') {
    return `${String(start.getHours()).padStart(2, '0')}:00 - ${String(end.getHours()).padStart(2, '0')}:59`;
  }

  if (period === 'day') {
    return start.toLocaleDateString('vi-VN');
  }

  if (period === 'week') {
    return `${start.toLocaleDateString('vi-VN')} - ${end.toLocaleDateString('vi-VN')}`;
  }

  return `Tháng ${start.getMonth() + 1}/${start.getFullYear()}`;
};

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;

  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'pending':
      return { label: 'Đơn mới', color: '#D97706', bg: '#FEF3C7' };
    case 'preparing':
      return { label: 'Đang chuẩn bị', color: '#2563EB', bg: '#DBEAFE' };
    case 'delivering':
      return { label: 'Đang giao', color: '#7C3AED', bg: '#EDE9FE' };
    case 'completed':
      return { label: 'Hoàn thành', color: '#059669', bg: '#D1FAE5' };
    default:
      return { label: status || 'Chưa rõ', color: '#4B5563', bg: '#F3F4F6' };
  }
};

const FieldLabel = ({ children, color }: { children: string; color: string }) => (
  <Text style={{ color, fontSize: 12, fontFamily: 'Sora-SemiBold', marginBottom: 8 }}>
    {children}
  </Text>
);

const ProductManagementView = ({ colors, isDark }: { colors: any; isDark: boolean }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyProductForm);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProducts();
      setProducts(data.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách sản phẩm từ Firebase.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(products.map((product) => product.category).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    return ['All', ...uniqueCategories];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const keyword = normalizeSearchValue(searchText);

    return products.filter((product) =>
      (selectedCategory === 'All' || product.category === selectedCategory) &&
      [product.name, product.category, product.description, String(Math.round((product.price || 0) * EXCHANGE_RATE))]
        .filter(Boolean)
        .some((value) => normalizeSearchValue(String(value)).includes(keyword))
    );
  }, [products, searchText, selectedCategory]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm(emptyProductForm);
    setModalVisible(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name || '',
      category: product.category || '',
      description: product.description || '',
      image_url: product.image_url || '',
      priceVnd: toPriceInput(product.price),
      rating: String(product.rating ?? '4.5'),
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    if (!saving) setModalVisible(false);
  };

  const updateField = (field: keyof ProductFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const readImageFile = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const rawDataUrl = String(reader.result || '');
        const img = new window.Image();

        img.onload = () => {
          const maxSize = 900;
          const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));

          const context = canvas.getContext('2d');
          if (!context) {
            resolve(rawDataUrl);
            return;
          }

          context.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };

        img.onerror = () => resolve(rawDataUrl);
        img.src = rawDataUrl;
      };

      reader.onerror = () => reject(new Error('READ_FILE_FAILED'));
      reader.readAsDataURL(file);
    });

  const pickImageFromComputer = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      Alert.alert('Chưa hỗ trợ', 'Chức năng chọn ảnh từ máy tính hiện hỗ trợ trên bản web admin.');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp,image/gif';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        Alert.alert('File không hợp lệ', 'Vui lòng chọn file ảnh.');
        return;
      }

      try {
        const dataUrl = await readImageFile(file);
        updateField('image_url', dataUrl);
      } catch (error) {
        console.error('Error reading image file:', error);
        Alert.alert('Lỗi', 'Không thể đọc file ảnh. Vui lòng thử ảnh khác.');
      }
    };
    input.click();
  };

  const buildProductInput = (): ProductInput | null => {
    const priceVnd = parseMoneyInput(form.priceVnd);
    const rating = Number(form.rating.replace(',', '.'));

    if (!form.name.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên sản phẩm.');
      return null;
    }

    if (!form.category.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập danh mục sản phẩm.');
      return null;
    }

    if (!Number.isFinite(priceVnd) || priceVnd <= 0) {
      Alert.alert('Giá không hợp lệ', 'Giá bán phải lớn hơn 0.');
      return null;
    }

    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
      Alert.alert('Rating không hợp lệ', 'Rating phải nằm trong khoảng từ 0 đến 5.');
      return null;
    }

    return {
      name: form.name.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      image_url: form.image_url.trim(),
      price: priceVnd / EXCHANGE_RATE,
      rating,
    };
  };

  const handleSave = async () => {
    const productInput = buildProductInput();
    if (!productInput) return;

    setSaving(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productInput);
      } else {
        await addProduct(productInput);
      }

      setModalVisible(false);
      await loadProducts();
      Alert.alert('Thành công', editingProduct ? 'Đã cập nhật sản phẩm.' : 'Đã thêm sản phẩm mới.');
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Lỗi', 'Không thể lưu sản phẩm. Vui lòng kiểm tra kết nối Firebase.');
    } finally {
      setSaving(false);
    }
  };

  const deleteSelectedProduct = async (product: Product) => {
    if (!product.id) {
      Alert.alert('Lỗi', 'Không tìm thấy mã sản phẩm để xóa.');
      return;
    }

    try {
      await deleteProduct(product.id);
      await loadProducts();
      Alert.alert('Thành công', 'Đã xóa sản phẩm.');
    } catch (error) {
      console.error('Error deleting product:', error);
      Alert.alert('Lỗi', 'Không thể xóa sản phẩm. Vui lòng thử lại.');
    }
  };

  const confirmDelete = (product: Product) => {
    const message = `Bạn chắc chắn muốn xóa "${product.name}" khỏi Firebase?`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(message)) {
        void deleteSelectedProduct(product);
      }
      return;
    }

    Alert.alert('Xóa sản phẩm', message, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => void deleteSelectedProduct(product),
      },
    ]);
  };

  const inputStyle = {
    backgroundColor: colors.card,
    borderColor: colors.border,
    color: colors.text,
    fontFamily: 'Sora-Regular',
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 12,
        marginHorizontal: 16,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        <ProductImage uri={item.image_url} style={{ width: 78, height: 78, borderRadius: 12 }} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontFamily: 'Sora-Bold', fontSize: 16 }} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 12, marginTop: 3 }} numberOfLines={1}>
                {item.category}
              </Text>
            </View>
            <Text style={{ color: '#C67C4E', fontFamily: 'Sora-Bold', fontSize: 14 }}>
              {formatVNDFromUSD(item.price)}
            </Text>
          </View>

          <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 12, marginTop: 8, lineHeight: 17 }} numberOfLines={2}>
            {item.description || 'Chưa có mô tả'}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 12, marginLeft: 4 }}>
                {item.rating || 0}
              </Text>
            </View>

            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                onPress={() => openEditModal(item)}
                style={{
                  backgroundColor: isDark ? '#1F2937' : '#EFF6FF',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  marginRight: 8,
                }}
              >
                <Text style={{ color: '#2563EB', fontFamily: 'Sora-SemiBold', fontSize: 12 }}>Sửa</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => confirmDelete(item)}
                style={{
                  backgroundColor: isDark ? '#3A1F1F' : '#FEE2E2',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: '#DC2626', fontFamily: 'Sora-SemiBold', fontSize: 12 }}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
          <TouchableOpacity
            onPress={openCreateModal}
            style={{
              flex: 1,
              backgroundColor: '#C67C4E',
              borderRadius: 14,
              paddingVertical: 13,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
            }}
          >
            <Ionicons name="add-circle-outline" size={19} color="white" />
            <Text style={{ color: 'white', fontFamily: 'Sora-Bold', fontSize: 14, marginLeft: 8 }}>
              Thêm sản phẩm
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={loadProducts}
            style={{
              width: 48,
              marginLeft: 10,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
            }}
          >
            <FontAwesome5 name="sync-alt" size={14} color="#C67C4E" />
          </TouchableOpacity>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 14,
            paddingHorizontal: 12,
          }}
        >
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Tìm tên món, danh mục, giá..."
            placeholderTextColor={colors.textSecondary}
            style={{ flex: 1, color: colors.text, fontFamily: 'Sora-Regular', paddingVertical: 10, marginLeft: 8 }}
            returnKeyType="search"
          />
          {searchText.trim() ? (
            <TouchableOpacity onPress={() => setSearchText('')} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 12 }}>
            Hiển thị {filteredProducts.length}/{products.length} sản phẩm
          </Text>
          {(searchText.trim() || selectedCategory !== 'All') ? (
            <TouchableOpacity
              onPress={() => {
                setSearchText('');
                setSelectedCategory('All');
              }}
            >
              <Text style={{ color: '#C67C4E', fontFamily: 'Sora-SemiBold', fontSize: 12 }}>Xóa lọc</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingTop: 10, paddingRight: 8 }}>
          {categories.map((category) => {
            const selected = selectedCategory === category;
            return (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={{
                  backgroundColor: selected ? '#C67C4E' : colors.card,
                  borderColor: selected ? '#C67C4E' : colors.border,
                  borderWidth: 1,
                  borderRadius: 999,
                  paddingHorizontal: 13,
                  paddingVertical: 8,
                  marginRight: 8,
                }}
              >
                <Text style={{ color: selected ? 'white' : colors.text, fontFamily: selected ? 'Sora-Bold' : 'Sora-Regular', fontSize: 12 }}>
                  {category === 'All' ? 'Tất cả' : category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#C67C4E" />
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <Ionicons name="cafe-outline" size={54} color={colors.textSecondary} />
          <Text style={{ color: colors.text, fontFamily: 'Sora-Bold', fontSize: 18, marginTop: 14 }}>
            Chưa có sản phẩm
          </Text>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 13, textAlign: 'center', marginTop: 6 }}>
            Nhấn "Thêm sản phẩm" để tạo món mới và lưu trực tiếp lên Firebase.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' }}>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <View>
                  <Text style={{ color: colors.text, fontFamily: 'Sora-Bold', fontSize: 20 }}>
                    {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 12, marginTop: 4 }}>
                    Dữ liệu sẽ được lưu ở nhánh Firebase products.
                  </Text>
                </View>
                <TouchableOpacity onPress={closeModal} style={{ padding: 8 }}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <FieldLabel color={colors.textSecondary}>Tên sản phẩm</FieldLabel>
              <TextInput
                value={form.name}
                onChangeText={(value) => updateField('name', value)}
                placeholder="Ví dụ: Cappuccino"
                placeholderTextColor={colors.textSecondary}
                style={[inputStyle, { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 }]}
              />

              <FieldLabel color={colors.textSecondary}>Danh mục</FieldLabel>
              <TextInput
                value={form.category}
                onChangeText={(value) => updateField('category', value)}
                placeholder="Coffee, Bakery, Syrup..."
                placeholderTextColor={colors.textSecondary}
                style={[inputStyle, { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 }]}
              />

              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <FieldLabel color={colors.textSecondary}>Giá bán (VND)</FieldLabel>
                  <TextInput
                    value={form.priceVnd}
                    onChangeText={(value) => updateField('priceVnd', value)}
                    keyboardType="number-pad"
                    placeholder="45000"
                    placeholderTextColor={colors.textSecondary}
                    style={[inputStyle, { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 }]}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <FieldLabel color={colors.textSecondary}>Rating</FieldLabel>
                  <TextInput
                    value={form.rating}
                    onChangeText={(value) => updateField('rating', value)}
                    keyboardType="decimal-pad"
                    placeholder="4.8"
                    placeholderTextColor={colors.textSecondary}
                    style={[inputStyle, { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 }]}
                  />
                </View>
              </View>

              <FieldLabel color={colors.textSecondary}>Ảnh sản phẩm</FieldLabel>
              <View
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 16,
                  padding: 12,
                  marginBottom: 14,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ProductImage uri={form.image_url} style={{ width: 72, height: 72, borderRadius: 14 }} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: colors.text, fontFamily: 'Sora-SemiBold', fontSize: 13 }} numberOfLines={1}>
                      {form.image_url.trim() ? 'Đã chọn ảnh sản phẩm' : 'Chưa chọn ảnh'}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 11, marginTop: 4 }} numberOfLines={2}>
                      Chọn ảnh từ máy tính. Ảnh sẽ được tối ưu trước khi lưu.
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', marginTop: 12 }}>
                  <TouchableOpacity
                    onPress={pickImageFromComputer}
                    style={{
                      flex: 1,
                      backgroundColor: '#C67C4E',
                      borderRadius: 12,
                      paddingVertical: 11,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                    }}
                  >
                    <Ionicons name="cloud-upload-outline" size={17} color="white" />
                    <Text style={{ color: 'white', fontFamily: 'Sora-Bold', fontSize: 13, marginLeft: 8 }}>
                      Chọn ảnh từ máy tính
                    </Text>
                  </TouchableOpacity>

                  {form.image_url.trim() ? (
                    <TouchableOpacity
                      onPress={() => updateField('image_url', '')}
                      style={{
                        width: 46,
                        marginLeft: 10,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isDark ? '#3A1F1F' : '#FEE2E2',
                      }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              <FieldLabel color={colors.textSecondary}>URL ảnh (tuỳ chọn)</FieldLabel>
              <TextInput
                value={form.image_url.startsWith('data:image/') ? '' : form.image_url}
                onChangeText={(value) => updateField('image_url', value)}
                placeholder="Có thể dán URL nếu không upload file"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                style={[inputStyle, { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 }]}
              />

              <FieldLabel color={colors.textSecondary}>Mô tả</FieldLabel>
              <TextInput
                value={form.description}
                onChangeText={(value) => updateField('description', value)}
                placeholder="Mô tả ngắn về sản phẩm"
                placeholderTextColor={colors.textSecondary}
                multiline
                textAlignVertical="top"
                style={[inputStyle, { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, minHeight: 100, marginBottom: 18 }]}
              />

              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={{
                  backgroundColor: '#C67C4E',
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                  opacity: saving ? 0.65 : 1,
                }}
              >
                <Text style={{ color: 'white', fontFamily: 'Sora-Bold', fontSize: 14 }}>
                  {saving ? 'Đang lưu...' : editingProduct ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const CustomerManagementView = ({ colors, orders }: { colors: any; orders: OrderData[] }) => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      setCustomers(await fetchCustomers());
    } catch (error) {
      console.error('Error fetching customers:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách khách hàng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const customerStats = useMemo(() => {
    const stats: Record<string, { orders: number; spent: number }> = {};
    orders.forEach((order) => {
      const customerKey = order.user_id || (order.userEmail || '').toLowerCase();
      if (!customerKey) return;
      const current = stats[customerKey] || { orders: 0, spent: 0 };
      current.orders += 1;
      if (order.status !== 'cancelled') current.spent += Number(order.totalPrice) || 0;
      stats[customerKey] = current;
    });
    return stats;
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    const keyword = normalizeSearchValue(searchText);
    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone, customer.location]
        .filter(Boolean)
        .some((value) => normalizeSearchValue(String(value)).includes(keyword))
    );
  }, [customers, searchText]);

  const toggleBlocked = async (customer: CustomerData) => {
    const nextBlocked = !customer.isBlocked;
    setUpdatingId(customer.id);
    try {
      await setCustomerBlocked(customer.id, nextBlocked);
      setCustomers((current) => current.map((item) => item.id === customer.id ? { ...item, isBlocked: nextBlocked } : item));
      Alert.alert('Thành công', nextBlocked ? 'Đã khóa tài khoản khách hàng.' : 'Đã mở khóa tài khoản khách hàng.');
    } catch (error) {
      console.error('Error updating customer:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái khách hàng.');
    } finally {
      setUpdatingId(null);
    }
  };

  const renderCustomer = ({ item }: { item: CustomerData }) => {
    const stats = customerStats[item.id] || customerStats[(item.email || '').toLowerCase()] || { orders: 0, spent: 0 };
    return (
      <View style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 14, marginHorizontal: 16, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#C67C4E20', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#C67C4E', fontFamily: 'Sora-Bold', fontSize: 18 }}>{(item.name || 'K')[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: colors.text, fontFamily: 'Sora-Bold', fontSize: 15 }}>{item.name || 'Chưa cập nhật tên'}</Text>
            <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 12, marginTop: 3 }}>{item.email}</Text>
            {item.phone ? <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 12, marginTop: 2 }}>{item.phone}</Text> : null}
          </View>
          <View style={{ backgroundColor: item.isBlocked ? '#FEE2E2' : '#D1FAE5', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 }}>
            <Text style={{ color: item.isBlocked ? '#DC2626' : '#059669', fontFamily: 'Sora-SemiBold', fontSize: 11 }}>{item.isBlocked ? 'Đã khóa' : 'Hoạt động'}</Text>
          </View>
        </View>

        {item.location ? <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 12, marginTop: 10 }}>Địa chỉ: {item.location}</Text> : null}

        <View style={{ flexDirection: 'row', marginTop: 13, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 11 }}>Đơn hàng</Text>
            <Text style={{ color: colors.text, fontFamily: 'Sora-Bold', fontSize: 15, marginTop: 3 }}>{stats.orders}</Text>
          </View>
          <View style={{ flex: 2 }}>
            <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 11 }}>Tổng chi tiêu</Text>
            <Text style={{ color: '#C67C4E', fontFamily: 'Sora-Bold', fontSize: 14, marginTop: 3 }}>{formatVNDFromUSD(stats.spent)}</Text>
          </View>
          <TouchableOpacity disabled={updatingId === item.id} onPress={() => toggleBlocked(item)} style={{ backgroundColor: item.isBlocked ? '#D1FAE5' : '#FEE2E2', borderRadius: 10, paddingHorizontal: 12, justifyContent: 'center', opacity: updatingId === item.id ? 0.5 : 1 }}>
            <Text style={{ color: item.isBlocked ? '#059669' : '#DC2626', fontFamily: 'Sora-SemiBold', fontSize: 12 }}>{item.isBlocked ? 'Mở khóa' : 'Khóa'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12 }}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput value={searchText} onChangeText={setSearchText} placeholder="Tìm tên, email, số điện thoại..." placeholderTextColor={colors.textSecondary} style={{ flex: 1, color: colors.text, fontFamily: 'Sora-Regular', paddingVertical: 11, marginLeft: 8 }} />
          <TouchableOpacity onPress={loadCustomers} style={{ padding: 5 }}><FontAwesome5 name="sync-alt" size={14} color="#C67C4E" /></TouchableOpacity>
        </View>
        <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 12, marginTop: 9 }}>Hiển thị {filteredCustomers.length}/{customers.length} khách hàng</Text>
      </View>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color="#C67C4E" /></View>
      ) : filteredCustomers.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><FontAwesome5 name="users" size={44} color={colors.textSecondary} /><Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', marginTop: 12 }}>Không tìm thấy khách hàng</Text></View>
      ) : (
        <FlatList data={filteredCustomers} keyExtractor={(item) => item.id} renderItem={renderCustomer} contentContainerStyle={{ paddingBottom: 24 }} />
      )}
    </View>
  );
};

const OrdersView = ({
  colors,
  orders,
  loading,
  onRefresh,
}: {
  colors: any;
  orders: OrderData[];
  loading: boolean;
  onRefresh: () => void;
}) => {
  const renderOrder = ({ item }: { item: OrderData }) => {
    const statusInfo = getStatusInfo(item.status);

    return (
      <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14, marginHorizontal: 16, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 12 }}>
            #{item.id.slice(-6).toUpperCase()}
          </Text>
          <View style={{ backgroundColor: statusInfo.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Text style={{ color: statusInfo.color, fontFamily: 'Sora-SemiBold', fontSize: 12 }}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        {item.items?.map((product, index) => (
          <Text key={`${product.product_id || product.name}-${index}`} style={{ color: colors.text, fontFamily: 'Sora-Regular', fontSize: 13, marginBottom: 4 }}>
            - {product.name || product.product_id} x{product.quantity}
          </Text>
        ))}

        <View style={{ borderTopColor: colors.border, borderTopWidth: 1, marginTop: 10, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 12 }}>
              {formatDateTime(item.createdAt)}
            </Text>
            <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 12, marginTop: 3 }}>
              {item.paymentMethod}
            </Text>
          </View>
          <Text style={{ color: '#C67C4E', fontFamily: 'Sora-Bold', fontSize: 16 }}>
            {formatVNDFromUSD(item.totalPrice || 0)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        onPress={onRefresh}
        style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 14, paddingVertical: 12, marginHorizontal: 16, marginBottom: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
      >
        <FontAwesome5 name="sync-alt" size={14} color="#C67C4E" />
        <Text style={{ color: '#C67C4E', fontFamily: 'Sora-SemiBold', fontSize: 13, marginLeft: 8 }}>Tải lại đơn hàng</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#C67C4E" />
        </View>
      ) : orders.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <FontAwesome5 name="clipboard-list" size={48} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 16, marginTop: 14 }}>Chưa có đơn hàng</Text>
        </View>
      ) : (
        <FlatList data={orders} keyExtractor={(item) => item.id} renderItem={renderOrder} contentContainerStyle={{ paddingBottom: 24 }} />
      )}
    </View>
  );
};

const AnalyticsView = ({ colors, orders }: { colors: any; orders: OrderData[] }) => {
  const [period, setPeriod] = useState<RevenuePeriod>('day');

  const analytics = useMemo(() => {
    const { start, end } = getPeriodRange(period);
    const productSales: Record<string, number> = {};
    const revenueOrdersInPeriod: OrderData[] = [];
    const revenueOrders = orders.filter((order) => {
      const createdAt = new Date(order.createdAt);
      return !Number.isNaN(createdAt.getTime()) && order.status !== 'cancelled';
    });

    revenueOrders.forEach((order) => {
      const createdAt = new Date(order.createdAt);
      const isInPeriod =
        createdAt.getTime() >= start.getTime() &&
        createdAt.getTime() <= end.getTime();

      if (!isInPeriod) return;

      revenueOrdersInPeriod.push(order);
      order.items?.forEach((item) => {
        const name = (item.name || item.product_id || 'Unknown product').replace(/\s*\([SML]\)\s*$/, '');
        productSales[name] = (productSales[name] || 0) + item.quantity;
      });
    });

    const getRevenueInRange = (range: { start: Date; end: Date }) =>
      revenueOrders.reduce((sum, order) => {
        const createdAt = new Date(order.createdAt).getTime();
        return createdAt >= range.start.getTime() && createdAt <= range.end.getTime()
          ? sum + (Number(order.totalPrice) || 0)
          : sum;
      }, 0);

    const periodRevenue = revenueOrdersInPeriod.reduce((sum, order) => sum + (Number(order.totalPrice) || 0), 0);
    const totalItems = revenueOrdersInPeriod.reduce(
      (sum, order) => sum + (order.items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0),
      0
    );

    const todayRange = getPeriodRange('day');
    const todayOrders = revenueOrders.filter((order) => {
      const createdAt = new Date(order.createdAt).getTime();
      return createdAt >= todayRange.start.getTime() && createdAt <= todayRange.end.getTime();
    });

    const hourlyStats = Array.from({ length: 24 }, (_, hour) => {
      const hourOrders = todayOrders.filter((order) => new Date(order.createdAt).getHours() === hour);
      const productCount: Record<string, number> = {};
      hourOrders.forEach((order) => {
        order.items?.forEach((item) => {
          const name = (item.name || item.product_id || 'Unknown product').replace(/\s*\([SML]\)\s*$/, '');
          productCount[name] = (productCount[name] || 0) + item.quantity;
        });
      });
      const topProduct = Object.entries(productCount).sort((a, b) => b[1] - a[1])[0];

      return {
        hour,
        label: `${String(hour).padStart(2, '0')}:00`,
        orders: hourOrders.length,
        revenue: hourOrders.reduce((sum, order) => sum + (Number(order.totalPrice) || 0), 0),
        topProduct: topProduct ? { name: topProduct[0], quantity: topProduct[1] } : null,
      };
    });

    const bestHour = [...hourlyStats].sort((a, b) => b.revenue - a.revenue)[0];
    const currentHour = new Date().getHours();
    const currentSlot =
      currentHour < 10
        ? { label: 'Sáng', range: '06:00 - 10:00', hours: [6, 7, 8, 9], fallback: 'Cappuccino', reason: 'khách thường cần cà phê nóng để bắt đầu ngày mới' }
        : currentHour < 14
          ? { label: 'Trưa', range: '10:00 - 14:00', hours: [10, 11, 12, 13], fallback: 'Chocolate Chip Biscotti', reason: 'khách hay mua kèm bánh nhẹ hoặc món nhanh sau bữa trưa' }
          : currentHour < 18
            ? { label: 'Chiều', range: '14:00 - 18:00', hours: [14, 15, 16, 17], fallback: 'Cold Brew', reason: 'khung giờ cần món mát, dễ uống để tỉnh táo làm việc' }
            : { label: 'Tối', range: '18:00 - 22:00', hours: [18, 19, 20, 21], fallback: 'Latte', reason: 'khách có xu hướng chọn món nhẹ, dễ uống khi thư giãn' };

    const slotProductCount: Record<string, number> = {};
    todayOrders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      if (!currentSlot.hours.includes(hour)) return;
      order.items?.forEach((item) => {
        const name = (item.name || item.product_id || 'Unknown product').replace(/\s*\([SML]\)\s*$/, '');
        slotProductCount[name] = (slotProductCount[name] || 0) + item.quantity;
      });
    });
    const slotTopProduct = Object.entries(slotProductCount).sort((a, b) => b[1] - a[1])[0];
    const recommendation = slotTopProduct
      ? {
          title: `Nên đẩy món ${slotTopProduct[0]} trong khung ${currentSlot.range}`,
          reason: `Vì trong khung ${currentSlot.label.toLowerCase()} hôm nay món này đang bán tốt nhất (${slotTopProduct[1]} sản phẩm). Nên đặt làm món gợi ý, combo hoặc banner để tăng tỉ lệ chốt đơn.`,
        }
      : {
          title: `Nên đẩy món ${currentSlot.fallback} trong khung ${currentSlot.range}`,
          reason: `Vì ${currentSlot.reason}. Dữ liệu hiện tại còn ít, đề xuất này dùng hành vi mua phổ biến theo khung giờ để demo chiến lược bán hàng.`,
        };

    const topProducts = Object.entries(productSales)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      rangeLabel: getPeriodTitle(period, start, end),
      completedOrders: revenueOrdersInPeriod.length,
      completedRevenue: periodRevenue,
      averageOrder: revenueOrdersInPeriod.length ? periodRevenue / revenueOrdersInPeriod.length : 0,
      totalItems,
      topProducts,
      hourlyStats,
      bestHour,
      recommendation,
      quickRevenue: [
        { label: 'Giờ này', value: getRevenueInRange(getPeriodRange('hour')) },
        { label: 'Hôm nay', value: getRevenueInRange(getPeriodRange('day')) },
        { label: 'Tuần này', value: getRevenueInRange(getPeriodRange('week')) },
        { label: 'Tháng này', value: getRevenueInRange(getPeriodRange('month')) },
      ],
      ordersInPeriod: revenueOrdersInPeriod.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    };
  }, [orders, period]);

  const exportCsv = () => {
    try {
      let csv = `BAO CAO DOANH THU,${analytics.rangeLabel}\n`;
      csv += `Ngay xuat,${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}\n\n`;
      csv += 'TONG QUAN\n';
      analytics.quickRevenue.forEach((item) => {
        csv += `"${item.label}",${Math.round(item.value * EXCHANGE_RATE)}\n`;
      });
      csv += `\nDE XUAT,"${analytics.recommendation.title}","${analytics.recommendation.reason}"\n\n`;
      csv += 'DOANH THU THEO GIO HOM NAY\n';
      csv += 'Gio,So don,Doanh thu VND,San pham ban tot\n';
      analytics.hourlyStats.forEach((item) => {
        csv += `"${item.label}",${item.orders},${Math.round(item.revenue * EXCHANGE_RATE)},"${item.topProduct ? `${item.topProduct.name} (${item.topProduct.quantity})` : ''}"\n`;
      });
      csv += '\n';
      csv += 'Ma don,Ngay dat,Thanh toan,Trang thai,Tong tien VND\n';

      analytics.ordersInPeriod.forEach((order) => {
        csv += `"${order.id}","${formatDateTime(order.createdAt)}","${order.paymentMethod}","${order.status}",${Math.round((order.totalPrice || 0) * EXCHANGE_RATE)}\n`;
      });

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bao-cao-doanh-thu-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      Alert.alert('Thành công', 'Đã xuất báo cáo CSV theo kỳ đang chọn.');
    } catch (error) {
      console.error('Error exporting csv:', error);
      Alert.alert('Lỗi', 'Không thể xuất báo cáo.');
    }
  };

  const periodOptions: { key: RevenuePeriod; label: string }[] = [
    { key: 'hour', label: 'Giờ' },
    { key: 'day', label: 'Ngày' },
    { key: 'week', label: 'Tuần' },
    { key: 'month', label: 'Tháng' },
  ];

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 4, marginBottom: 12 }}>
        {periodOptions.map((option) => {
          const selected = period === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              onPress={() => setPeriod(option.key)}
              style={{
                flex: 1,
                borderRadius: 11,
                paddingVertical: 10,
                alignItems: 'center',
                backgroundColor: selected ? '#C67C4E' : 'transparent',
              }}
            >
              <Text style={{ color: selected ? 'white' : colors.textSecondary, fontFamily: selected ? 'Sora-Bold' : 'Sora-Regular', fontSize: 13 }}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ backgroundColor: '#C67C4E', borderRadius: 18, padding: 18, marginBottom: 12 }}>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'Sora-Regular', fontSize: 13 }}>
          Doanh thu {period === 'hour' ? 'giờ này' : period === 'day' ? 'hôm nay' : period === 'week' ? 'tuần này' : 'tháng này'}
        </Text>
        <Text style={{ color: 'white', fontFamily: 'Sora-Bold', fontSize: 28, marginTop: 8 }}>
          {formatVNDFromUSD(analytics.completedRevenue)}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'Sora-Regular', fontSize: 12, marginTop: 6 }}>
          {analytics.rangeLabel}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
        {analytics.quickRevenue.map((item) => (
          <View key={item.label} style={{ width: '48%', backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 14 }}>
            <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 11 }}>{item.label}</Text>
            <Text style={{ color: colors.text, fontFamily: 'Sora-Bold', fontSize: 16, marginTop: 6 }}>
              {formatVNDFromUSD(item.value)}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <FontAwesome5 name="lightbulb" size={16} color="#F59E0B" />
          <Text style={{ color: colors.text, fontFamily: 'Sora-Bold', fontSize: 16, marginLeft: 8 }}>Đề xuất bán hàng theo giờ</Text>
        </View>
        <Text style={{ color: '#C67C4E', fontFamily: 'Sora-Bold', fontSize: 14, lineHeight: 20 }}>
          {analytics.recommendation.title}
        </Text>
        <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 13, lineHeight: 20, marginTop: 6 }}>
          {analytics.recommendation.reason}
        </Text>
        {analytics.bestHour?.revenue > 0 ? (
          <Text style={{ color: colors.text, fontFamily: 'Sora-SemiBold', fontSize: 12, marginTop: 10 }}>
            Khung giờ doanh thu cao nhất hôm nay: {analytics.bestHour.label} với {formatVNDFromUSD(analytics.bestHour.revenue)}.
          </Text>
        ) : null}
      </View>

      <View style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <Text style={{ color: colors.text, fontFamily: 'Sora-Bold', fontSize: 16, marginBottom: 12 }}>Doanh thu theo giờ hôm nay</Text>
        {analytics.hourlyStats.filter((item) => item.revenue > 0 || item.orders > 0).length === 0 ? (
          <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 13 }}>Hôm nay chưa có đơn để vẽ doanh thu theo giờ.</Text>
        ) : (
          analytics.hourlyStats
            .filter((item) => item.revenue > 0 || item.orders > 0)
            .map((item, index) => (
              <View key={item.hour} style={{ paddingVertical: 9, borderTopColor: index === 0 ? 'transparent' : colors.border, borderTopWidth: index === 0 ? 0 : 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: colors.text, fontFamily: 'Sora-SemiBold', fontSize: 13 }}>{item.label}</Text>
                  <Text style={{ color: '#C67C4E', fontFamily: 'Sora-Bold', fontSize: 13 }}>{formatVNDFromUSD(item.revenue)}</Text>
                </View>
                <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 11, marginTop: 3 }}>
                  {item.orders} đơn{item.topProduct ? ` • Bán tốt: ${item.topProduct.name} (${item.topProduct.quantity})` : ''}
                </Text>
              </View>
            ))
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        <View style={{ flex: 1, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 13 }}>
          <FontAwesome5 name="receipt" size={15} color="#C67C4E" />
          <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 11, marginTop: 8 }}>Đơn ghi nhận</Text>
          <Text style={{ color: colors.text, fontFamily: 'Sora-Bold', fontSize: 20, marginTop: 4 }}>{analytics.completedOrders}</Text>
        </View>

        <View style={{ flex: 1, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 13 }}>
          <FontAwesome5 name="mug-hot" size={15} color="#10B981" />
          <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 11, marginTop: 8 }}>Sản phẩm bán</Text>
          <Text style={{ color: colors.text, fontFamily: 'Sora-Bold', fontSize: 20, marginTop: 4 }}>{analytics.totalItems}</Text>
        </View>

        <View style={{ flex: 1, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 13 }}>
          <FontAwesome5 name="chart-line" size={15} color="#2563EB" />
          <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 11, marginTop: 8 }}>TB mỗi đơn</Text>
          <Text style={{ color: colors.text, fontFamily: 'Sora-Bold', fontSize: 13, marginTop: 8 }}>
            {formatVNDFromUSD(analytics.averageOrder)}
          </Text>
        </View>
      </View>

      <TouchableOpacity onPress={exportCsv} style={{ backgroundColor: '#10B981', borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginBottom: 12 }}>
        <FontAwesome5 name="file-csv" size={15} color="white" />
        <Text style={{ color: 'white', fontFamily: 'Sora-Bold', fontSize: 14, marginLeft: 8 }}>Xuất báo cáo CSV</Text>
      </TouchableOpacity>

      <View style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <Text style={{ color: colors.text, fontFamily: 'Sora-Bold', fontSize: 16, marginBottom: 12 }}>Món bán nhiều nhất</Text>
        {analytics.topProducts.length === 0 ? (
          <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 13 }}>Chưa có dữ liệu bán hàng trong kỳ này.</Text>
        ) : (
          analytics.topProducts.map((item, index) => (
            <View key={item.name} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderTopColor: index === 0 ? 'transparent' : colors.border, borderTopWidth: index === 0 ? 0 : 1 }}>
              <Text style={{ color: colors.text, fontFamily: 'Sora-SemiBold', fontSize: 13, flex: 1 }} numberOfLines={1}>
                {index + 1}. {item.name}
              </Text>
              <Text style={{ color: '#C67C4E', fontFamily: 'Sora-Bold', fontSize: 13 }}>{item.quantity}</Text>
            </View>
          ))
        )}
      </View>

      <View style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 16 }}>
        <Text style={{ color: colors.text, fontFamily: 'Sora-Bold', fontSize: 16, marginBottom: 12 }}>Đơn hàng trong kỳ</Text>
        {analytics.ordersInPeriod.length === 0 ? (
          <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 13 }}>Chưa có đơn ghi nhận trong kỳ này.</Text>
        ) : (
          analytics.ordersInPeriod.slice(0, 8).map((order, index) => (
            <View key={order.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopColor: index === 0 ? 'transparent' : colors.border, borderTopWidth: index === 0 ? 0 : 1 }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ color: colors.text, fontFamily: 'Sora-SemiBold', fontSize: 13 }}>#{order.id.slice(-6).toUpperCase()}</Text>
                <Text style={{ color: colors.textSecondary, fontFamily: 'Sora-Regular', fontSize: 11, marginTop: 3 }}>
                  {formatDateTime(order.createdAt)}
                </Text>
              </View>
              <Text style={{ color: '#C67C4E', fontFamily: 'Sora-Bold', fontSize: 13 }}>
                {formatVNDFromUSD(order.totalPrice || 0)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const AdminPanel = () => {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const ordersRef = ref(fireBaseDB, 'orders');
      const snapshot = await get(ordersRef);
      const data = snapshot.val();

      if (!data) {
        setOrders([]);
        return;
      }

      const orderList: OrderData[] = Object.entries(data).map(([key, value]: [string, any]) => ({
        id: key,
        ...value,
      }));
      orderList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(orderList);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách đơn hàng.');
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const tabs: { key: AdminTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'products', label: 'Sản phẩm', icon: 'cafe-outline' },
    { key: 'orders', label: 'Đơn hàng', icon: 'receipt-outline' },
    { key: 'customers', label: 'Khách hàng', icon: 'people-outline' },
    { key: 'analytics', label: 'Thống kê', icon: 'stats-chart-outline' },
  ];

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <PageTransition>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <PageHeader title="Quản trị cửa hàng" showHeaderRight={false} bgColor={colors.surface} />

          <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 12, backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1 }}>
            {tabs.map((tab) => {
              const selected = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 10,
                    borderRadius: 14,
                    backgroundColor: selected ? '#C67C4E' : 'transparent',
                    marginHorizontal: 4,
                  }}
                >
                  <Ionicons name={tab.icon} size={17} color={selected ? 'white' : colors.textSecondary} />
                  <Text style={{ color: selected ? 'white' : colors.textSecondary, fontFamily: selected ? 'Sora-Bold' : 'Sora-Regular', fontSize: 12, marginTop: 4 }}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {activeTab === 'products' ? (
            <ProductManagementView colors={colors} isDark={isDark} />
          ) : activeTab === 'orders' ? (
            <OrdersView colors={colors} orders={orders} loading={ordersLoading} onRefresh={fetchOrders} />
          ) : activeTab === 'customers' ? (
            <CustomerManagementView colors={colors} orders={orders} />
          ) : (
            <AnalyticsView colors={colors} orders={orders} />
          )}
        </SafeAreaView>
      </PageTransition>
    </GestureHandlerRootView>
  );
};

export default AdminPanel;
