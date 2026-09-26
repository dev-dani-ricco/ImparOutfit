import ApiFoundationScreen from '../screens/ApiFoundationScreen';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import FavoritesScreen from '../screens/FavoritesScreen';
import FeedScreen from '../screens/FeedScreen';
import DaniRicoScreen from '../screens/DaniRicoScreen';
import ItemFormScreen from '../screens/ItemFormScreen';
import LoginScreen from '../screens/LoginScreen';
import PersonalCollectionFormScreen from '../screens/PersonalCollectionFormScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ShowcasesScreen from '../screens/ShowcasesScreen';
import StoreDashboardScreen from '../screens/StoreDashboardScreen';
import StoreCampaignScreen from '../screens/StoreCampaignScreen';
import StoreDetailScreen from '../screens/StoreDetailScreen';
import StoresScreen from '../screens/StoresScreen';
import WardrobeItemScreen from '../screens/WardrobeItemScreen';
import WardrobePlansScreen from '../screens/WardrobePlansScreen';
import WardrobeScreen from '../screens/WardrobeScreen';

const RootStack = createNativeStackNavigator();
const FeedStackNav = createNativeStackNavigator();
const StoreStackNav = createNativeStackNavigator();
const WardrobeStackNav = createNativeStackNavigator();
const DaniStackNav = createNativeStackNavigator();
const ProfileStackNav = createNativeStackNavigator();
const BrandStackNav = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const icons = {
  Feed: '✦',
  Lojas: '⌂',
  Armário: '◇',
  'Dani Rico': '✎',
  Perfil: '○',
  Universo: '◇',
  'Análise ÍMPAR': '✦',
};

const stackOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.text,
  headerTitleStyle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.3 },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
};

function FeedStack() {
  return (
    <FeedStackNav.Navigator initialRouteName="Feed principal" screenOptions={stackOptions}>
      <FeedStackNav.Screen name="Referência comercial" component={WardrobeItemScreen} />
      <FeedStackNav.Screen name="Feed principal" component={FeedScreen} options={{ title: 'IMPAR OUTFIT  •  FEED DAS LOJAS' }} />
      <FeedStackNav.Screen name="Favoritas" component={FavoritesScreen} options={{ title: 'PUBLICAÇÕES FAVORITAS' }} />
      <FeedStackNav.Screen name="Campanha patrocinada" component={ShowcasesScreen} options={{ title: 'CONTEÚDO PATROCINADO • AD' }} />
      <FeedStackNav.Screen name="Loja do anúncio" component={StoreDetailScreen} options={{ title: 'VITRINE DA MARCA' }} />
    </FeedStackNav.Navigator>
  );
}

function StoreStack() {
  return (
    <StoreStackNav.Navigator screenOptions={stackOptions}>
      <StoreStackNav.Screen name="Lista de lojas" component={StoresScreen} options={{ title: 'IMPAR OUTFIT  •  MARCAS' }} />
      <StoreStackNav.Screen name="Loja" component={StoreDetailScreen} options={{ title: 'PERFIL DA MARCA' }} />
    </StoreStackNav.Navigator>
  );
}

function WardrobeStack() {
  return (
    <WardrobeStackNav.Navigator screenOptions={stackOptions}>
      <WardrobeStackNav.Screen name="Meu armário" component={WardrobeScreen} options={{ title: 'IMPAR OUTFIT  •  ARMÁRIO' }} />
      <WardrobeStackNav.Screen name="Nova peça" component={ItemFormScreen} options={{ title: 'CATALOGAÇÃO DE PEÇA' }} />
      <WardrobeStackNav.Screen name="Planos do armário" component={WardrobePlansScreen} options={{ title: 'CAPACIDADE E PLANOS' }} />
      <WardrobeStackNav.Screen name="Peça 2D e 3D" component={WardrobeItemScreen} options={{ title: 'ITEM DIGITAL' }} />
      <WardrobeStackNav.Screen name="Nova coleção" component={PersonalCollectionFormScreen} options={{ title: 'COLEÇÃO PARTICULAR' }} />
    </WardrobeStackNav.Navigator>
  );
}

function DaniStack() {
  return (
    <DaniStackNav.Navigator screenOptions={stackOptions}>
      <DaniStackNav.Screen name="Painel da Dani" component={DaniRicoScreen} options={{ title: 'IMPAR OUTFIT  •  DANI RICO' }} />
      <DaniStackNav.Screen name="Peça recomendada" component={WardrobeItemScreen} options={{ title: 'INDICAÇÃO DEMONSTRATIVA' }} />
    </DaniStackNav.Navigator>
  );
}

function ProfileStack() {
  return (
    <ProfileStackNav.Navigator screenOptions={stackOptions}>
      <ProfileStackNav.Screen name="Meu perfil" component={ProfileScreen} options={{ headerShown: false }} />
    </ProfileStackNav.Navigator>
  );
}

function ConnectedExperience() {
  return (
    <Tab.Navigator
      initialRouteName="Universo"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.bg,
        tabBarInactiveTintColor: colors.muted,
        tabBarActiveBackgroundColor: colors.accent,
        tabBarInactiveBackgroundColor: colors.bg,
        tabBarStyle: { height: 72, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.line },
        tabBarItemStyle: { paddingTop: 7, paddingBottom: 7 },
        tabBarLabelStyle: { fontSize: 8, fontWeight: '900', letterSpacing: 0.4 },
        tabBarIcon: ({ color, focused }) => (
          <Text style={{ color, fontSize: focused ? 21 : 17, fontWeight: '900' }}>{icons[route.name]}</Text>
        ),
      })}
    >
      <Tab.Screen name="Universo" component={ApiFoundationScreen} />
      <Tab.Screen name="Análise ÍMPAR" component={DaniRicoScreen} />
    </Tab.Navigator>
  );
}

function PersonExperience() {
  return (
    <Tab.Navigator
      initialRouteName="Perfil"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.bg,
        tabBarInactiveTintColor: colors.muted,
        tabBarActiveBackgroundColor: colors.accent,
        tabBarInactiveBackgroundColor: colors.bg,
        tabBarStyle: { height: 72, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.line },
        tabBarItemStyle: { paddingTop: 7, paddingBottom: 7 },
        tabBarLabelStyle: { fontSize: 8, fontWeight: '900', letterSpacing: 0.4 },
        tabBarIcon: ({ color, focused }) => (
          <Text style={{ color, fontSize: focused ? 21 : 17, fontWeight: '900' }}>{icons[route.name]}</Text>
        ),
      })}
    >
      <Tab.Screen name="Perfil" component={ProfileStack} />
      <Tab.Screen name="Armário" component={WardrobeStack} />
      <Tab.Screen name="Lojas" component={StoreStack} />
      <Tab.Screen name="Feed" component={FeedStack} />
      <Tab.Screen name="Dani Rico" component={DaniStack} />
    </Tab.Navigator>
  );
}

function BrandExperience() {
  return (
    <BrandStackNav.Navigator screenOptions={stackOptions}>
      <BrandStackNav.Screen name="Painel da marca" component={StoreDashboardScreen} options={{ headerShown: false }} />
      <BrandStackNav.Screen name="Nova peça" component={ItemFormScreen} initialParams={{ store: true }} options={{ title: 'PUBLICAR NO CATÁLOGO' }} />
      <BrandStackNav.Screen name="Peça publicada" component={WardrobeItemScreen} options={{ title: 'PEÇA PUBLICADA • PRÉVIA' }} />
      <BrandStackNav.Screen
        name="Prévia da vitrine"
        component={StoreDetailScreen}
        initialParams={{ storeId: 'store-aurora', preview: true }}
        options={{ title: 'COMO A CLIENTE VÊ' }}
      />
      <BrandStackNav.Screen name="Campanhas" component={StoreCampaignScreen} options={{ title: 'MÍDIA E ANÚNCIOS • AD' }} />
    </BrandStackNav.Navigator>
  );
}

function Splash() {
  return (
    <View style={styles.splash}>
      <Text style={styles.splashBrand}>IMPAR</Text>
      <Text style={styles.splashSignature}>Outfit</Text>
      <ActivityIndicator color={colors.accent} style={styles.spinner} />
    </View>
  );
}

export default function RootNavigator() {
  const { isReady, token, user, activeContext, demoMode } = useAuth();

  if (!isReady) return <Splash />;
  if(token && !demoMode)return <ConnectedExperience />;

  return (
    <RootStack.Navigator screenOptions={stackOptions}>
      {token ? (
        <RootStack.Screen
          name="IMPAROutfit"
          component={activeContext !== 'personal' && user?.contexts?.some(c=>c.organization_id===activeContext) ? BrandExperience : PersonExperience}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <RootStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <RootStack.Screen name="Cadastro" component={RegisterScreen} options={{ title: '' }} />
        </>
      )}
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  splashBrand: { color: colors.text, fontSize: 27, fontWeight: '800', letterSpacing: 8 },
  splashSignature: { color: colors.accent, fontFamily: 'serif', fontStyle: 'italic', fontSize: 25, marginTop: 2 },
  spinner: { marginTop: 25 },
});
