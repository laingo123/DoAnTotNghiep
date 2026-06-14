import {Text, View,Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { router } from 'expo-router'

const Banner = () => {
  return (
    <TouchableOpacity 
      className="w-full rounded-lg items-center bg-[#F9F9F9]"
      onPress={() => router.push('/promotions')}
      activeOpacity={0.85}
    >
        <View
        className='absolute w-full h-[72px] -top-1 items-center bg-[#222222]'
        />
            <Image   
            source={require('../assets/images/banner.png')}
            resizeMode="cover"
            className="w-[90%] h-36 rounded-3xl"
            />
            <View
            className='w-[90%] pl-5 absolute mt-2'
            > 

            {/* Promo Badge */}
            <Text 
                className=" bg-[#ED5151] rounded-lg text-white mb-1 text-m p-1.5 font-[Sora-SemiBold] self-start"
                >Promo
            </Text>
            {/* Promo Title */}

            {/* <View
                className='bg-[#222222] w-[75%] h-7 top-6'
            >
            </View> */}
            {/* <View
            className='bg-[#222222] w-[60%] h-7 top-9'
            >
            </View> */}

            <Text
            className='text-white text-2xl font-[Sora-SemiBold] mt-4 w-[60%] -top-3'
            style={{ lineHeight: 34 }}
            >
            Buy one get one FREE
            </Text>
        </View>
    </TouchableOpacity>
  )
}

export default Banner
