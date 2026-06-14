import React from 'react'
import { View, Text } from 'react-native'
import {Tabs} from 'expo-router'
import Entypo from '@expo/vector-icons/Entypo';
import { FontAwesome6, FontAwesome } from '@expo/vector-icons';
import { useAuth } from '@/components/AuthContext';
import { useLanguage } from '@/components/LanguageContext';
import { useTheme } from '@/components/ThemeContext';
import { useCart } from '@/components/CartContext';

const TabsLayout = () => {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const { totalCount } = useCart();

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#C67C4E',
          tabBarInactiveTintColor: isDark ? '#888' : '#999',
          tabBarStyle: {
            backgroundColor: colors.tabBarBg,
            borderTopColor: colors.tabBarBorder,
          },
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
        }}
      >
        <Tabs.Screen 
          name='home'
          options={{
            headerShown: false,
            title: 'Home',
            tabBarIcon: ({color}) => (
              <Entypo name="home" size={24} color={color} />
            )
          }}
        />

        <Tabs.Screen 
          name='chatRoom'
          options={{
            headerShown: true,
            tabBarStyle: { display: 'none' },
            title: t('chat_bot'),
            tabBarIcon: ({color }) => (
              <FontAwesome6 name="robot" size={24} color={color} />
            )
          }}
        />

    <Tabs.Screen 
          name='order'
          options={{
            headerShown: true,
            tabBarStyle: { display: 'none' },
            title: t('cart'),
            tabBarIcon: ({color}) => (
              <View>
                <Entypo name="shopping-cart" size={24} color={color} />
                {totalCount > 0 && (
                  <View style={{
                    position: 'absolute', top: -6, right: -10,
                    backgroundColor: '#FF4757', borderRadius: 10,
                    minWidth: 18, height: 18,
                    alignItems: 'center', justifyContent: 'center',
                    paddingHorizontal: 4,
                  }}>
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                      {totalCount > 99 ? '99+' : totalCount}
                    </Text>
                  </View>
                )}
              </View>
            )
          }}
        />

      <Tabs.Screen
        name="admin"
        options={{
          headerShown: false,
          title: t('admin_panel'),
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="clipboard-list" size={24} color={color} />
          ),
          href: isAdmin ? '/(tabs)/admin' : null,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          title: t('profile'),
          tabBarIcon: ({ color }) => (
            <FontAwesome icon="fa-solid fa-user" name="user" size={24} color={color}  />
          ),
        }}
      />
      </Tabs>
      
    </>
  )
}

export default TabsLayout