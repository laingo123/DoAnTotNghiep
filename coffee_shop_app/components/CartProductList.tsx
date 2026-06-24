import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { Product } from '@/types/types';
import OrdersHeader from './OrdersHeader';
import OrdersFooter from './OrdersFooter';
import { useTheme } from './ThemeContext';
import ProductImage from './ProductImage';
import { formatVNDFromUSD } from '@/utils/currency';

const SIZE_EXTRA: Record<string, number> = {
  S: 0,
  M: 0.5,
  L: 1,
};

const parseCartKey = (itemKey: string) => {
  const match = itemKey.match(/\s*\(([SML])\)\s*$/);
  const size = match?.[1];
  const productName = size ? itemKey.replace(/\s*\([SML]\)\s*$/, '') : itemKey;

  return {
    productName,
    size,
    sizeExtra: size ? SIZE_EXTRA[size] || 0 : 0,
  };
};

interface ProductListProps {
  products: Product[];
  quantities: { [key: string]: number };
  setQuantities: (itemKey: string, delta: number) => void;
  totalPrice: number;
}

type CartLine = {
  key: string;
  product: Product;
  quantity: number;
  size?: string;
  unitPrice: number;
};

const ProductList: React.FC<ProductListProps> = ({ products, quantities, setQuantities, totalPrice }) => {
  const { colors, isDark } = useTheme();

  const cartLines = Object.entries(quantities)
    .filter(([_, quantity]) => quantity > 0)
    .map(([itemKey, quantity]) => {
      const { productName, size, sizeExtra } = parseCartKey(itemKey);
      const product = products.find((item) => item.name === productName);

      return product
        ? {
            key: itemKey,
            product,
            quantity,
            size,
            unitPrice: product.price + sizeExtra,
          }
        : null;
    })
    .filter(Boolean) as CartLine[];

  const renderItem = ({ item }: { item: CartLine }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 28, paddingBottom: 12, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <ProductImage uri={item.product.image_url} style={{ width: 64, height: 64, borderRadius: 8 }} />
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text style={{ fontSize: 18, fontFamily: 'Sora-SemiBold', color: colors.text }} numberOfLines={1}>
          {item.product.name}
        </Text>
        <Text style={{ fontFamily: 'Sora-Regular', fontSize: 12, color: colors.textSecondary }}>
          {item.product.category}{item.size ? ` • Size ${item.size}` : ''}
        </Text>
        <Text style={{ fontFamily: 'Sora-SemiBold', fontSize: 14, color: '#C67C4E', marginTop: 2 }}>
          {formatVNDFromUSD(item.unitPrice)}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#333' : '#F0F0F0', borderRadius: 12, paddingHorizontal: 4 }}>
        <TouchableOpacity onPress={() => setQuantities(item.key, -1)} style={{ padding: 8 }}>
          <Text style={{ fontSize: 20, color: colors.text, fontWeight: 'bold' }}>-</Text>
        </TouchableOpacity>
        <Text style={{ marginHorizontal: 10, fontSize: 16, color: colors.text, fontFamily: 'Sora-SemiBold' }}>
          {item.quantity}
        </Text>
        <TouchableOpacity onPress={() => setQuantities(item.key, 1)} style={{ padding: 8 }}>
          <Text style={{ fontSize: 20, color: '#C67C4E', fontWeight: 'bold' }}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View>
      {cartLines.length > 0 ? (
        <FlatList
          ListHeaderComponent={<OrdersHeader />}
          ListFooterComponent={<OrdersFooter totalPrice={totalPrice} />}
          data={cartLines}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
        />
      ) : (
        <View style={{ marginHorizontal: 28, alignItems: 'center', marginTop: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>Cart</Text>
          <Text style={{ fontSize: 20, fontFamily: 'Sora-SemiBold', color: colors.textSecondary, marginBottom: 8, textAlign: 'center' }}>Giỏ hàng trống</Text>
          <Text style={{ fontSize: 14, fontFamily: 'Sora-Regular', color: colors.textSecondary, textAlign: 'center' }}>Hãy thêm món ngon vào giỏ nhé!</Text>
        </View>
      )}
    </View>
  );
};

export default ProductList;
