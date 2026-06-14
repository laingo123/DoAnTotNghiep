/// <reference types="nativewind/types" />
import { Text, View,SafeAreaView, ImageBackground  } from "react-native";
import { GestureHandlerRootView, TouchableOpacity } from "react-native-gesture-handler";
import {router} from "expo-router";
import { useLanguage } from "@/components/LanguageContext";
import PageTransition from "@/components/PageTransition";


export default function Index() {
  const { t } = useLanguage();

  return (
    <GestureHandlerRootView className="flex-1">
      <PageTransition>
      <SafeAreaView className="flex-1 bg-black">
      
        <ImageBackground 
          className="flex-1 w-full items-center justify-end"
          resizeMode="cover"
          imageStyle={{ width: '100%', height: '100%' }}
          source={require('../assets/images/index_bg_image.png')}
        >
          <View className="w-[80%] pb-16">
            <Text 
            className="text-white text-3xl text-center font-[Sora-SemiBold]"
            >
              {t('welcome_title')}
            </Text>

            <Text 
            className="pt-3 text-[#A2A2A2] text-center font-[Sora-Regular]" 
            >
            
            {t('welcome_subtitle')}
            </Text>
              <TouchableOpacity 
                className="bg-[#C57C3E] mt-10 p-3 rounded-lg items-center self-stretch" 
                onPress = {() => router.push("/login")}
              >
                <Text className="text-xl text-white font-[Sora-SemiBold]">{t('get_started')}</Text> 
              </TouchableOpacity> 
          </View>
        </ImageBackground>
      </SafeAreaView>
      </PageTransition>
    </GestureHandlerRootView>
  );
}
