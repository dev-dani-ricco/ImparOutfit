import AvatarStudioScreen from '../screens/AvatarStudioScreen';
import {
  ConnectedDiscoveryScreen,
  ConnectedHomeScreen,
  ConnectedProfileScreen,
  ConnectedStoreAccountScreen,
  ConnectedStoreCampaignScreen,
  ConnectedStoreCatalogScreen,
  ConnectedStoreDashboardScreen,
  ConnectedWardrobeScreen,
} from '../screens/ConnectedProductScreens';
import RealisticAvatarStudioScreen from '../screens/RealisticAvatarStudioScreen';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import FavoritesScreen from '../screens/FavoritesScreen';
import FeedScreen from '../screens/FeedScreen';
import HomeScreen from '../screens/HomeScreen';
import DaniRicoScreen from '../screens/DaniRicoScreen';
import ItemFormScreen from '../screens/ItemFormScreen';
import LoginScreen from '../screens/LoginScreen';
import PersonalCollectionFormScreen from '../screens/PersonalCollectionFormScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ShowcasesScreen from '../screens/ShowcasesScreen';
import StoreDashboardScreen from '../screens/StoreDashboardScreen';
import StoreCampaignScreen from '../screens/StoreCampaignScreen';
import StoreCatalogScreen from '../screens/StoreCatalogScreen';
import StoreAccountScreen from '../screens/StoreAccountScreen';
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
const ConnectedProfileStackNav = createNativeStackNavigator();
const BrandStackNav = createNativeStackNavigator();
const BrandTab = createBottomTabNavigator();
const ConnectedBrandTab = createBottomTabNavigator();
const ConnectedTab = createBottomTabNavigator();
const Tab = createBottomTabNavigator();

const icons = {
  Início: '◆',
  Descobrir: '✦',
  Armário: '◇',
  Análise: '✎',
  Perfil: '○',
  Universo: '◇',
  'Análise ÍMPAR': '✦',
  Painel: '▣',
  Catálogo: '◇',
  Campanhas: 'AD',
  Conta: '○',
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
      <FeedStackNav.Screen name="Feed principal" component={FeedScreen} options={{ title: 'IMPAR OUTFIT  •  DESCOBRIR' }} />
      <FeedStackNav.Screen name="Lojas" component={StoresScreen} options={{ title: 'MARCAS' }} />
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
      <ProfileStackNav.Screen name="Avatar Studio" component={AvatarStudioScreen} options={{ headerShown: false }} />
      <ProfileStackNav.Screen name="Avatar Realista" component={RealisticAvatarStudioScreen} options={{ headerShown: false }} />
    </ProfileStackNav.Navigator>
  );
}

function ConnectedProfileStack() {
  return (
    <ConnectedProfileStackNav.Navigator screenOptions={stackOptions}>
      <ConnectedProfileStackNav.Screen name="Perfil conectado" component={ConnectedProfileScreen} options={{ headerShown: false }} />
      <ConnectedProfileStackNav.Screen name="Avatar Studio Conectado" component={AvatarStudioScreen} options={{ headerShown: false }} />
    </ConnectedProfileStackNav.Navigator>
  );
}

function ConnectedPersonExperience() {
  return (
    <ConnectedTab.Navigator
      initialRouteName="Início"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#8F8983',
        tabBarActiveBackgroundColor: '#171719',
        tabBarInactiveBackgroundColor: '#0B0B0C',
        tabBarStyle: { height: 74, backgroundColor: '#0B0B0C', borderTopWidth: 0, paddingTop: 4 },
        tabBarItemStyle: { paddingTop: 6, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 8, fontWeight: '900', letterSpacing: 0.4 },
        tabBarIcon: ({ color, focused }) => (
          <Text style={{ color: focused ? colors.gold : color, fontSize: focused ? 20 : 16, fontWeight: '900' }}>{icons[route.name]}</Text>
        ),
      })}
    >
      <ConnectedTab.Screen name="Início" component={ConnectedHomeScreen} />
      <ConnectedTab.Screen name="Armário" component={ConnectedWardrobeScreen} />
      <ConnectedTab.Screen name="Descobrir" component={ConnectedDiscoveryScreen} />
      <ConnectedTab.Screen name="Análise" component={DaniRicoScreen} />
      <ConnectedTab.Screen name="Perfil" component={ConnectedProfileStack} />
    </ConnectedTab.Navigator>
  );
}

function ConnectedBrandExperience() {
  return (
    <ConnectedBrandTab.Navigator
      initialRouteName="Painel"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#8F8983',
        tabBarActiveBackgroundColor: '#171719',
        tabBarInactiveBackgroundColor: '#0B0B0C',
        tabBarStyle: { height: 74, backgroundColor: '#0B0B0C', borderTopWidth: 0, paddingTop: 4 },
        tabBarItemStyle: { paddingTop: 6, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 8, fontWeight: '900', letterSpacing: 0.4 },
        tabBarIcon: ({ color, focused }) => (
          <Text style={{ color: focused ? colors.gold : color, fontSize: route.name === 'Campanhas' ? 11 : focused ? 20 : 16, fontWeight: '900' }}>{icons[route.name]}</Text>
        ),
      })}
    >
      <ConnectedBrandTab.Screen name="Painel" component={ConnectedStoreDashboardScreen} />
      <ConnectedBrandTab.Screen name="Catálogo" component={ConnectedStoreCatalogScreen} />
      <ConnectedBrandTab.Screen name="Campanhas" component={ConnectedStoreCampaignScreen} />
      <ConnectedBrandTab.Screen name="Conta" component={ConnectedStoreAccountScreen} />
    </ConnectedBrandTab.Navigator>
  );
}

function PersonExperience() {
  return (
    <Tab.Navigator
      initialRouteName="Início"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#8F8983',
        tabBarActiveBackgroundColor: '#171719',
        tabBarInactiveBackgroundColor: '#0B0B0C',
        tabBarStyle: { height: 74, backgroundColor: '#0B0B0C', borderTopWidth: 0, paddingTop: 4 },
        tabBarItemStyle: { paddingTop: 6, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 8, fontWeight: '900', letterSpacing: 0.4 },
        tabBarIcon: ({ color, focused }) => (
          <Text style={{ color: focused ? colors.gold : color, fontSize: focused ? 20 : 16, fontWeight: '900' }}>{icons[route.name]}</Text>
        ),
      })}
    >
      <Tab.Screen name="Início" component={HomeScreen} />
      <Tab.Screen name="Armário" component={WardrobeStack} />
      <Tab.Screen name="Descobrir" component={FeedStack} />
      <Tab.Screen name="Análise" component={DaniStack} />
      <Tab.Screen name="Perfil" component={ProfileStack} />
    </Tab.Navigator>
  );
}

function BrandTabs() {
  return (
    <BrandTab.Navigator
      initialRouteName="Painel"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#8F8983',
        tabBarActiveBackgroundColor: '#171719',
        tabBarInactiveBackgroundColor: '#0B0B0C',
        tabBarStyle: { height: 74, backgroundColor: '#0B0B0C', borderTopWidth: 0, paddingTop: 4 },
        tabBarItemStyle: { paddingTop: 6, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 8, fontWeight: '900', letterSpacing: 0.4 },
        tabBarIcon: ({ color, focused }) => (
          <Text style={{ color: focused ? colors.gold : color, fontSize: route.name === 'Campanhas' ? 11 : focused ? 20 : 16, fontWeight: '900' }}>{icons[route.name]}</Text>
        ),
      })}
    >
      <BrandTab.Screen name="Painel" component={StoreDashboardScreen} />
      <BrandTab.Screen name="Catálogo" component={StoreCatalogScreen} />
      <BrandTab.Screen name="Campanhas" component={StoreCampaignScreen} />
      <BrandTab.Screen name="Conta" component={StoreAccountScreen} />
    </BrandTab.Navigator>
  );
}

function BrandExperience() {
  return (
    <BrandStackNav.Navigator screenOptions={stackOptions}>
      <BrandStackNav.Screen name="Marca" component={BrandTabs} options={{ headerShown: false }} />
      <BrandStackNav.Screen name="Nova peça" component={ItemFormScreen} initialParams={{ store: true }} options={{ title: 'PUBLICAR NO CATÁLOGO' }} />
      <BrandStackNav.Screen name="Peça publicada" component={WardrobeItemScreen} options={{ title: 'PEÇA PUBLICADA • PRÉVIA' }} />
      <BrandStackNav.Screen
        name="Prévia da vitrine"
        component={StoreDetailScreen}
        initialParams={{ storeId: 'store-aurora', preview: true }}
        options={{ title: 'COMO A CLIENTE VÊ' }}
      />
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
  if (token && !demoMode) {
    const organizationActive = activeContext !== 'personal' && user?.contexts?.some((context) => context.organization_id === activeContext);
    return organizationActive ? <ConnectedBrandExperience /> : <ConnectedPersonExperience />;
  }

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
