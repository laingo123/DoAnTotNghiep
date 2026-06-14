import React from 'react';
import { View, Text, Image, TouchableOpacity, FlatList } from 'react-native';
import { Product } from '@/types/types';
import OrdersHeader from './OrdersHeader';
import OrdersFooter from './OrdersFooter';
import { useTheme } from './ThemeContext';

// Props for ProductList
interface ProductListProps {
    products: Product[];
    quantities: { [key: string]: number };
    setQuantities: (itemKey: string, delta: number) => void;
    totalPrice: number;
  }
  
const ProductList: React.FC<ProductListProps> = ({ products, quantities, setQuantities, totalPrice }) => {
    const { colors, isDark } = useTheme();

    const filteredProducts = products.filter((product) => (quantities[product.name] || 0) > 0);

    const renderItem = ({ item }: { item: Product }) => (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 28, paddingBottom: 12, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Image
          source={{ uri: item.image_url }}
          style={{ width: 64, height: 64, borderRadius: 8 }}
        />
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={{ fontSize: 18, fontFamily: 'Sora-SemiBold', color: colors.text }}>{item.name}</Text>
          <Text style={{ fontFamily: 'Sora-Regular', fontSize: 12, color: colors.textSecondary }}>{item.category}</Text>
          <Text style={{ fontFamily: 'Sora-SemiBold', fontSize: 14, color: '#C67C4E', marginTop: 2 }}>${item.price}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#333' : '#F0F0F0', borderRadius: 12, paddingHorizontal: 4 }}>
          <TouchableOpacity onPress={() => setQuantities(item.name, -1)} style={{ padding: 8 }}>
            <Text style={{ fontSize: 20, color: colors.text, fontWeight: 'bold' }}>−</Text>
          </TouchableOpacity>
          <Text style={{ marginHorizontal: 10, fontSize: 16, color: colors.text, fontFamily: 'Sora-SemiBold' }}>{quantities[item.name] || 0}</Text>
          <TouchableOpacity onPress={() => setQuantities(item.name, 1)} style={{ padding: 8 }}>
            <Text style={{ fontSize: 20, color: '#C67C4E', fontWeight: 'bold' }}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  
    return (
        <View>
            {filteredProducts.length > 0 ? (
                <FlatList
                    ListHeaderComponent={<OrdersHeader />}
                    ListFooterComponent={<OrdersFooter totalPrice={totalPrice} />}
                    data={filteredProducts}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.name}
                />
            ) : (
                
                <View style={{ marginHorizontal: 28, alignItems: 'center', marginTop: 40 }}>
                    <Text style={{ fontSize: 48, marginBottom: 16 }}>🛒</Text>
                    <Text style={{ fontSize: 20, fontFamily: 'Sora-SemiBold', color: colors.textSecondary, marginBottom: 8, textAlign: 'center' }}>Giỏ hàng trống</Text>
                    <Text style={{ fontSize: 14, fontFamily: 'Sora-Regular', color: colors.textSecondary, textAlign: 'center' }}>Hãy thêm món ngon vào giỏ nhé!</Text>
                </View>
            )}
        </View>
    );
  };
  
export default ProductList;