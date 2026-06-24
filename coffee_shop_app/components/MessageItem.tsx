import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { heightPercentageToDP } from 'react-native-responsive-screen';
import { MessageInterface, Product } from '@/types/types';
import ProductImage from './ProductImage';
import { formatVNDFromUSD } from '@/utils/currency';
import { useTheme } from './ThemeContext';

interface Message {
    message: MessageInterface;
    onSelectProduct?: (product: Product, size: 'S' | 'M' | 'L') => void;
}

const MessageItem = ({message, onSelectProduct}:Message) => {
  const { colors, isDark } = useTheme();
  const [selectedSizes, setSelectedSizes] = useState<Record<string, 'S' | 'M' | 'L'>>({});

  if (message?.role == 'user') {
    return (
        <View
            className='flex-row justify-end  mb-3 mr-3'
        >
            <View className='w-80%'>
                <View className='self-end p-3 rounded-2xl bg-white border border-neutral-200'>
                    <Text 
                        style = {{fontSize: heightPercentageToDP(1.9)}}>
                        {message?.content}
                    </Text>
                </View>
            </View>

        </View>
    )
  } else {
    return (
        <View style={{ marginLeft: 12, marginBottom: 12, maxWidth: message.products?.length ? '100%' : '80%' }}>
            <View style={{ alignSelf: 'flex-start', padding: 12, paddingHorizontal: 16, borderRadius: 16, backgroundColor: isDark ? '#29243B' : '#E0E7FF', borderWidth: 1, borderColor: isDark ? '#443A63' : '#C7D2FE' }}>
                <Text
                    style = {{fontSize: heightPercentageToDP(1.9), color: colors.text}}
                >
                    {message?.content}
                </Text>
            </View>

            {!!message.products?.length && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 10, paddingRight: 12 }}
              >
                {message.products.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    activeOpacity={0.8}
                    style={{
                      width: 155,
                      marginRight: 10,
                      padding: 10,
                      borderRadius: 16,
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <ProductImage uri={product.image_url} style={{ width: '100%', height: 92, borderRadius: 12 }} />
                    <Text numberOfLines={1} style={{ color: colors.text, fontFamily: 'Sora-SemiBold', fontSize: 13, marginTop: 8 }}>
                      {product.name}
                    </Text>
                    <Text style={{ color: '#C67C4E', fontFamily: 'Sora-Bold', fontSize: 13, marginTop: 4 }}>
                      {formatVNDFromUSD(product.price)}
                    </Text>

                    <View style={{ flexDirection: 'row', marginTop: 8 }}>
                      {(['S', 'M', 'L'] as const).map((size) => {
                        const isSelected = (selectedSizes[product.id] || 'S') === size;
                        return (
                          <TouchableOpacity
                            key={size}
                            onPress={() => setSelectedSizes((current) => ({ ...current, [product.id]: size }))}
                            style={{
                              flex: 1,
                              alignItems: 'center',
                              paddingVertical: 5,
                              marginRight: size === 'L' ? 0 : 4,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: isSelected ? '#C67C4E' : colors.border,
                              backgroundColor: isSelected ? '#C67C4E20' : colors.card,
                            }}
                          >
                            <Text style={{ color: isSelected ? '#C67C4E' : colors.textSecondary, fontFamily: 'Sora-SemiBold', fontSize: 11 }}>
                              {size}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <TouchableOpacity
                      onPress={() => onSelectProduct?.(product, selectedSizes[product.id] || 'S')}
                      style={{ backgroundColor: '#C67C4E', borderRadius: 10, paddingVertical: 7, alignItems: 'center', marginTop: 8 }}
                    >
                      <Text style={{ color: 'white', fontFamily: 'Sora-SemiBold', fontSize: 12 }}>+ Đặt món</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

        </View>
    )
  }
}

export default MessageItem
