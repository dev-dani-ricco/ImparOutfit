import React from 'react';
import { Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import FeedScreen from '../screens/FeedScreen';
import WardrobeScreen from '../screens/WardrobeScreen';
import StoresScreen from '../screens/StoresScreen';
import ItemFormScreen from '../screens/ItemFormScreen';
import ShowcasesScreen from '../screens/ShowcasesScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const icons = { Feed: '✦', Lojas: '⌂', Armário: '◇', Vitrines: '▣' };

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
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
        tabBarLabelStyle: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
        tabBarIcon: ({ color, focused }) => (
          <Text style={{ color, fontSize: focused ? 22 : 18, fontWeight: '800' }}>
            {icons[route.name]}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Lojas" component={StoresScreen} />
      <Tab.Screen name="Armário" component={WardrobeScreen} />
      <Tab.Screen name="Vitrines" component={ShowcasesScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { token } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontSize: 14, fontWeight: '700', letterSpacing: 2 },
        headerShadowVisible: false,
      }}
    >
      {token ? (
        <>
          <Stack.Screen
            name="IMPAROutfit"
            component={Tabs}
            options={{ headerShown: true, title: 'IMPAR  OUTFIT  •  DEMO' }}
          />
          <Stack.Screen name="Nova peça" component={ItemFormScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Cadastro" component={RegisterScreen} options={{ title: '' }} />
        </>
      )}
    </Stack.Navigator>
  );
}
