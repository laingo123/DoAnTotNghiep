import {Text, View } from 'react-native'
import React from 'react'
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import { TouchableOpacity } from "react-native-gesture-handler";
import { useTheme } from './ThemeContext';

const SearchArea = () => {
  const { colors } = useTheme();

  return (
    <View
        style={{ width: '100%', alignItems: 'center', backgroundColor: colors.headerBg, paddingBottom: 24 }}>
        <View style={{ width: '90%', paddingTop: 32 }}>
        <Text style={{ color: '#A2A2A2', fontSize: 14, fontFamily: 'Sora-Regular' }}>
            Location
        </Text>
        <Text style={{ color: '#FFFFFF', fontFamily: 'Sora-Regular' }}>
            Da Nang, Ngu Hanh Son
        </Text>

        
        <View style={{ width: '100%', marginTop: 20, flexDirection: 'row', alignItems: 'center' }}>
            <View 
              style={{ flex: 1, height: 56, paddingHorizontal: 16, backgroundColor: colors.inputBg, borderRadius: 16, justifyContent: 'center' }}
            >
            <AntDesign name="search" size={24} color="white" />
            </View>

            <TouchableOpacity 
              style={{ width: 56, height: 56, marginLeft: 12, backgroundColor: '#C67C4E', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
            >
            <Entypo name="sound-mix" size={24} color="white" />
            </TouchableOpacity> 
        </View>
        </View>
    </View>
  )
}

export default SearchArea
