import { Text, View, TouchableOpacity } from 'react-native'
import React from 'react'
import { useState } from 'react';
import { useLanguage } from './LanguageContext';

interface SizesSectionProps {
  onSizeChange?: (size: string, priceMultiplier: number) => void;
}

const SIZE_MULTIPLIERS: { [key: string]: number } = {
  'S': 0,      // Giá gốc (không cộng thêm)
  'M': 0.5,    // Cộng thêm $0.5
  'L': 1.0,    // Cộng thêm $1.0
};

const SizesSection = ({ onSizeChange }: SizesSectionProps) => {
  const [selectedSize, setSelectedSize] = useState<string>('S');
  const sizes = ['S', 'M', 'L'];
  const { t } = useLanguage();

  const handleSelect = (size: string) => {
    setSelectedSize(size);
    if (onSizeChange) {
      onSizeChange(size, SIZE_MULTIPLIERS[size]);
    }
  };

  return (
    <View>
        <Text
            className="text-[#242424] text-lg font-[Sora-SemiBold] ml-1 mt-4"
            >{t('size')}
        </Text>

        <View className="flex-row justify-center items-center space-x-4 mt-3 mb-3">
            {sizes.map((size) => (
            <TouchableOpacity
                key={size}
                onPress={() => handleSelect(size)}
                className={`px-4 py-2 rounded-2xl w-[30%] items-center ${
                selectedSize === size ? 'bg-[#fdf5f0] border-2 border-app_orange_color' : 'bg-white'
                }`}
            >
                <Text className={`font-[Sora-Regular] ${selectedSize === size ? 'text-app_orange_color' : 'text-black'}`}>{size}</Text>
                <Text className={`text-xs font-[Sora-Regular] mt-1 ${selectedSize === size ? 'text-app_orange_color' : 'text-gray-400'}`}>
                  {size === 'S' ? '' : `+$${SIZE_MULTIPLIERS[size].toFixed(1)}`}
                </Text>
            </TouchableOpacity>
            ))}
        </View>
    </View>
  )
}

export default SizesSection