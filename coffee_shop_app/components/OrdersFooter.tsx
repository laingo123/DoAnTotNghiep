import React from 'react';
import { View, Text } from 'react-native';
import { formatVNDFromUSD } from '@/utils/currency';

interface OrdersFooterProps {
    totalPrice: number;
}

const OrdersFooter: React.FC<OrdersFooterProps> = ({ totalPrice }) => {
    return (
        <>
            <View className='border-b-4 border-[#F9F2ED] mt-3' />
            <Text className="mx-7 text-[#242424] text-lg font-[Sora-SemiBold] mb-4 mt-4">
                Payment Summary
            </Text>

            <View className='flex-row justify-between mx-7 mb-3'>
                <Text className='text-base font-[Sora-Regular]'>
                    Giá tiền
                </Text>
                <Text className='text-base font-[Sora-SemiBold]'>
                    {formatVNDFromUSD(totalPrice)}
                </Text>
            </View>

            <View className='flex-row justify-between mx-7 pb-8'>
                <Text className='text-base font-[Sora-Regular]'>
                    Phí giao hàng
                </Text>
                <Text className='text-base font-[Sora-SemiBold]'>
                    {formatVNDFromUSD(totalPrice === 0 ? 0 : 1)}
                </Text>
            </View>
        </>
    );
};

export default OrdersFooter;