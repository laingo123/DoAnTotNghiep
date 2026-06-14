import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router, Stack } from 'expo-router';
import { useTheme } from './ThemeContext';

interface HeaderProps {
    title: string;
    showHeaderRight: boolean;
    bgColor:string;
}

const PageHeader: React.FC<HeaderProps> = ({ title, showHeaderRight, bgColor }) => {
    const { colors } = useTheme();

    return (
        <Stack.Screen
            options={{
                headerShadowVisible: false,
                headerStyle: {
                    backgroundColor: bgColor,
                },
                headerTitleAlign: 'center',
                headerTitle: () => (
                    <Text style={{ fontSize: 20, color: colors.text, fontFamily: 'Sora-SemiBold' }}>
                        {title}
                    </Text>
                ),
                headerRight: showHeaderRight
                    ? () => (
                            <FontAwesome5
                                style={{ marginRight: 10 }}
                                name="heart"
                                size={24}
                                color={colors.text}
                            />
                        )
                    : undefined,
                headerBackVisible: false,
                headerLeft: () => (
                    <GestureHandlerRootView style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                        <TouchableOpacity style={{ paddingLeft: 8 }} onPress={() => router.back()}>
                            <Feather name="arrow-left" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </GestureHandlerRootView>
                ),
            }}
        />
    );
};

export default PageHeader;