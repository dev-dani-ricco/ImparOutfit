import React from 'react';
import { Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import FeedScreen from '../screens/FeedScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import WardrobeScreen from '../screens/WardrobeScreen';
import WardrobeItemScreen from '../screens/WardrobeItemScreen';
import PersonalCollectionFormScreen from '../screens/PersonalCollectionFormScreen';
import StoresScreen from '../screens/StoresScreen';
import StoreDetailScreen from '../screens/StoreDetailScreen';
import ItemFormScreen from '../screens/ItemFormScreen';
import ShowcasesScreen from '../screens/ShowcasesScreen';
import ProfileScreen from '../screens/ProfileScreen';

const RootStack = createNativeStackNavigator();
const FeedStackNav = createNativeStackNavigator();
const StoreStackNav = createNativeStackNavigator();
const WardrobeStackNav = createNativeStackNavigator();
const HighlightStackNav = createNativeStackNavigator();
const ProfileStackNav = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const icons = {
  Feed: '✦',
  Lojas: '⌂',
  Armário: '◇',
  Coleções: '▣',
  Perfil: '○',
};

const stackOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.text,
  headerTitleStyle: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
};

function FeedStack() {
  return (
    <FeedStackNav.Navigator screenOptions={stackOptions}>
      <FeedStackNav.Screen
        name="Feed principal"
        component={FeedScreen}
        options={{ title: 'IMPAR OUTFIT  •  DEMO' }}
      />
      <FeedStackNav.Screen
        name="Favoritas"
        component={FavoritesScreen}
        options={{ title: 'PUBLICAÇÕES FAVORITAS' }}
      />
    </FeedStackNav.Navigator>
  );
}

function StoreStack() {
  return (
    <StoreStackNav.Navigator screenOptions={stackOptions}>
      <StoreStackNav.Screen
        name="Lista de lojas"
        component={StoresScreen}
        options={{ title: 'IMPAR OUTFIT  •  LOJAS' }}
      />
      <StoreStackNav.Screen name="Loja" component={StoreDetailScreen} options={{ title: 'PERFIL DA MARCA' }} />
    </StoreStackNav.Navigator>
  );
}

function WardrobeStack() {
  return (
    <WardrobeStackNav.Navigator screenOptions={stackOptions}>
      <WardrobeStackNav.Screen
        name="Meu armário"
        component={WardrobeScreen}
        options={{ title: 'IMPAR OUTFIT  •  ARMÁRIO' }}
      />
      <WardrobeStackNav.Screen name="Nova peça" component={ItemFormScreen} options={{ title: 'CADASTRO 2D + 3D' }} />
      <WardrobeStackNav.Screen name="Peça 2D e 3D" component={WardrobeItemScreen} options={{ title: 'ITEM DIGITAL' }} />
      <WardrobeStackNav.Screen name="Nova coleção" component={PersonalCollectionFormScreen} options={{ title: 'COLEÇÃO PARTICULAR' }} />
    </WardrobeStackNav.Navigator>
  );
}

function HighlightStack() {
  return (
    <HighlightStackNav.Navigator screenOptions={stackOptions}>
      <HighlightStackNav.Screen
        name="Campanhas"
        component={ShowcasesScreen}
        options={{ title: 'IMPAR OUTFIT  •  PATROCINADO' }}
      />
    </HighlightStackNav.Navigator>
  );
}

function ProfileStack() {
  return (
    <ProfileStackNav.Navigator screenOptions={stackOptions}>
      <ProfileStackNav.Screen
        name="Meu perfil"
        component={ProfileScreen}
        options={{ title: 'IMPAR OUTFIT  •  PERFIL' }}
      />
    </ProfileStackNav.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.bg,
        tabBarInactiveTintColor: colors.muted,
        tabBarActiveBackgroundColor: colors.accent,
        tabBarInactiveBackgroundColor: colors.bg,
        tabBarStyle: {
          height: 72,
          backgroundColor: colors.bg,
          borderTopWidth: 1,
          borderTopColor: colors.line,
        },
        tabBarItemStyle: { paddingTop: 7, paddingBottom: 7 },
        tabBarLabelStyle: { fontSize: 8, fontWeight: '900', letterSpacing: 0.4 },
        tabBarIcon: ({ color, focused }) => (
          <Text style={{ color, fontSize: focused ? 21 : 17, fontWeight: '900' }}>
            {icons[route.name]}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Feed" component={FeedStack} />
      <Tab.Screen name="Lojas" component={StoreStack} />
      <Tab.Screen name="Armário" component={WardrobeStack} />
      <Tab.Screen name="Coleções" component={HighlightStack} />
      <Tab.Screen name="Perfil" component={ProfileStack} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { token } = useAuth();

  return (
    <RootStack.Navigator screenOptions={stackOptions}>
      {token ? (
        <RootStack.Screen name="IMPAROutfit" component={MainTabs} options={{ headerShown: false }} />
      ) : (
        <>
          <RootStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <RootStack.Screen name="Cadastro" component={RegisterScreen} options={{ title: '' }} />
        </>
      )}
    </RootStack.Navigator>
  );
}
