import {Text, TextInput, TouchableOpacity, View } from 'react-native'
import React from 'react'
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import { useTheme } from './ThemeContext';

interface SearchAreaProps {
  value: string;
  onChangeText: (value: string) => void;
  onClear?: () => void;
}

const SearchArea = ({ value, onChangeText, onClear }: SearchAreaProps) => {
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
              style={{ flex: 1, height: 56, paddingHorizontal: 16, backgroundColor: colors.inputBg, borderRadius: 16, alignItems: 'center', flexDirection: 'row' }}
            >
            <AntDesign name="search" size={22} color="white" />
            <TextInput
              value={value}
              onChangeText={onChangeText}
              placeholder="Tìm kiếm sản phẩm..."
              placeholderTextColor="#A2A2A2"
              returnKeyType="search"
              style={{ flex: 1, color: 'white', fontSize: 14, fontFamily: 'Sora-Regular', marginLeft: 10, paddingVertical: 0 }}
            />
            {value.trim() ? (
              <TouchableOpacity onPress={onClear} style={{ padding: 4 }}>
                <AntDesign name="closecircle" size={17} color="#A2A2A2" />
              </TouchableOpacity>
            ) : null}
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
