import {Text, View,StatusBar,ScrollView,TouchableOpacity } from 'react-native'
import { useEffect, useState } from 'react';
import { GestureHandlerRootView} from 'react-native-gesture-handler'
import React from 'react'
import PageHeader from '@/components/PageHeader'
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Product } from '@/types/types';
import { fetchProducts } from '@/services/productService';
import ProductList from '@/components/CartProductList';
import { useCart } from '@/components/CartContext';
import { useTheme } from '@/components/ThemeContext';
import Toast from 'react-native-root-toast';
import { router } from 'expo-router';
import PageTransition from '@/components/PageTransition';
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
    sizeExtra: size ? SIZE_EXTRA[size] || 0 : 0,
  };
};

const Order = () => {

  const { cartItems, SetQuantityCart, emptyCart, totalCount } = useCart();
  const { colors, isDark } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  const calculateTotal = (products: Product[], quantities: { [key: string]: number }): number => {
    return Object.entries(quantities).reduce((total, [itemKey, quantity]) => {
      if (quantity <= 0) return total;

      const { productName, sizeExtra } = parseCartKey(itemKey);
      const product = products.find((item) => item.name === productName);
      if (!product) return total;

      return total + (product.price + sizeExtra) * quantity;
    }, 0);
  };

  useEffect(() => {
    const total = calculateTotal(products, cartItems);
    setTotalPrice(total);
  }, [cartItems,products]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsData = await fetchProducts();

        setProducts(productsData);
      } catch (err) {
        setError("Error fetching products"+err);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  if (loading) return <Text style={{ color: colors.text }}>Loading...</Text>;
  if (error) return <Text style={{ color: colors.text }}>{error}</Text>;

  const orderNow = () => {
    router.push('/payment');
  };

  return (
    <GestureHandlerRootView
      style={{ backgroundColor: colors.background, width: '100%', height: '100%' }}
    >
      <PageTransition>
      <StatusBar backgroundColor={colors.surface} />
      <PageHeader title="Order" showHeaderRight={false} bgColor={colors.surface} />

      <View style={{ height: '100%', flexDirection: 'column', justifyContent: 'space-between' }}>

        <View style={{ height: '75%' }}>
          <ProductList products={products} quantities={cartItems} setQuantities={SetQuantityCart} totalPrice={totalPrice} />
        </View>
        
        <View
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 28,
              paddingTop: 12,
              paddingBottom: 24,
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 5,
            }}
          > 
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="wallet-outline" size={24} color="#C67C4E" />
              <View>
                <Text
                        style={{ color: colors.text, fontSize: 16, fontFamily: 'Sora-SemiBold', paddingBottom: 4, marginLeft: 12 }}
                  >Cash/Wallet
                </Text>
                <Text
                        style={{ color: '#C67C4E', fontSize: 14, fontFamily: 'Sora-SemiBold', marginLeft: 12 }}
                  >{formatVNDFromUSD(totalPrice + (totalPrice === 0 ? 0 : 1))} 
                </Text>
              </View>

            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {totalCount > 0 && (
                <View style={{
                  backgroundColor: '#FF4757', borderRadius: 12,
                  paddingHorizontal: 8, paddingVertical: 2, marginRight: 8,
                }}>
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>{totalCount} món</Text>
                </View>
              )}
              <MaterialIcons name="keyboard-arrow-down" size={24} color={colors.textSecondary} />
            </View>

          </View>
            
          <TouchableOpacity 
                style={{
                  backgroundColor: totalPrice === 0 ? (isDark ? '#444' : '#EDEDED') : '#C67C4E',
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 24,
                  paddingVertical: 12,
                }}
                disabled={totalPrice === 0}
                onPress={orderNow}
              >
                <Text style={{ fontSize: 20, color: 'white', fontFamily: 'Sora-Regular' }}>Order</Text> 
          </TouchableOpacity> 
        
        </View>

      </View>

      </PageTransition>
    </GestureHandlerRootView>
  )
}

export default Order
