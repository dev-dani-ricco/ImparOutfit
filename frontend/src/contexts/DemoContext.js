import { ActivityIndicator, View } from 'react-native';
import { useAuth } from './AuthContext';
import { personStorageKey, readPersonState, packPersonState, ownedItem, commercialReference, collectionReferences, seedPersonalDemo } from '../domain/personState.mjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  demoStores,
  initialPersonalCollections,
  initialProfile,
  initialWardrobe,
} from '../demo/data';
import {
  DEFAULT_WARDROBE_PLAN_ID,
  getWardrobeCapacity,
  getWardrobePlan,
} from '../config/wardrobePlans';

const DemoContext = createContext(null);
const initialDaniState = {
  completedLessons: {},
  lookReview: null,
  sessionBooked: false,
};
const initialCampaignState = {
  status: 'active',
  objective: 'Visitas à vitrine',
  dailyBudget: 45,
};

const cloneStores = () => demoStores.map((store) => ({
  ...store,
  items: store.items.map((item) => ({ ...item })),
}));

export const useDemo = () => useContext(DemoContext);

export function DemoProvider({children}) {
  const {user,demoMode}=useAuth();
  const personId=user?.person_id || user?.id || 'guest';
  return <PersonDemoProvider key={(demoMode?'demo':'api')+':'+personId} personId={personId} user={user} demoMode={demoMode}>{children}</PersonDemoProvider>;
}
function PersonDemoProvider({children,personId,user,demoMode}) {
  const STORAGE_KEY=personStorageKey(personId,demoMode?'demo':'api');
  const seeded=demoMode && personId==='demo-person';
  const {wardrobe:seedWardrobe,saves:seedSaves,collections:seedCollections}=seedPersonalDemo(seeded?personId:null,initialWardrobe,demoStores,initialPersonalCollections);
  const seedProfile=seeded ? {...initialProfile,personId} : {name:user?.name||'',personId};

  const [hydrated, setHydrated] = useState(false);
  const [favorites, setFavorites] = useState({});
  const [likes, setLikes] = useState({});
  const [following, setFollowing] = useState({});
  const [commercialSaves, setCommercialSaves] = useState(seedSaves);
  const [wardrobe, setWardrobe] = useState(seedWardrobe);
  const [wardrobePlanId, setWardrobePlanId] = useState(DEFAULT_WARDROBE_PLAN_ID);
  const [personalCollections, setPersonalCollections] = useState(seedCollections);
  const [profile, setProfile] = useState(seedProfile);
  const [stores, setStores] = useState(cloneStores);
  const [daniState, setDaniState] = useState(initialDaniState);
  const [campaignState, setCampaignState] = useState(initialCampaignState);

  useEffect(() => {
    let cancelled=false;
    async function restorePresentation() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        const state=readPersonState(saved,personId);
        if (!state) return;
        setFavorites(state.favorites || {});
        setLikes(state.likes || {});
        setFollowing(state.following || {});
        setCommercialSaves(state.commercialSaves || seedSaves);
        setWardrobe((state.wardrobe || seedWardrobe).filter(item=>item.personId===personId && item.kind==='OWNED_ITEM' && item.ownershipEvent));
        setWardrobePlanId(state.wardrobePlanId || DEFAULT_WARDROBE_PLAN_ID);
        setPersonalCollections(state.personalCollections || seedCollections);
        setProfile({ ...seedProfile, ...(state.profile || {}) });
        setStores(state.stores?.length ? state.stores : cloneStores());
        setDaniState(initialDaniState); // Do not restore retired editorial content.
        setCampaignState({ ...initialCampaignState, ...(state.campaignState || {}) });
      } catch (error) {
        console.warn('Não foi possível restaurar a demonstração.', error);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    restorePresentation();
    return ()=>{cancelled=true;};
  }, []);

  useEffect(() => {
    if (!hydrated || !demoMode || !user) return;

    const state = {
      favorites,
      likes,
      following,
      commercialSaves,
      wardrobe,
      wardrobePlanId,
      personalCollections,
      profile,
      stores,
      daniState,
      campaignState,
    };

    AsyncStorage.setItem(STORAGE_KEY, packPersonState(personId,state)).catch((error) => {
      console.warn('Não foi possível salvar a demonstração.', error);
    });
  }, [
    commercialSaves,
    favorites,
    following,
    hydrated,
    likes,
    personalCollections,
    profile,
    stores,
    wardrobe,
    wardrobePlanId,
    daniState,
    campaignState,
  ]);

  function toggleFavorite(id) {
    setFavorites((current) => ({ ...current, [id]: !current[id] }));
  }

  function toggleLike(id) {
    setLikes((current) => ({ ...current, [id]: !current[id] }));
  }

  function like(id) {
    setLikes((current) => (current[id] ? current : { ...current, [id]: true }));
  }

  function toggleFollowing(id) {
    setFollowing((current) => ({ ...current, [id]: !current[id] }));
  }

  function addWardrobeItem(item) {
    const capacity = getWardrobeCapacity(wardrobePlanId, wardrobe.length);
    if (capacity.isFull) return { ok: false, reason: 'LIMIT_REACHED', capacity };

    const created = ownedItem(personId,item);
    setWardrobe((current) => [created, ...current]);
    return { ok: true, item: created };
  }

  function saveCommercialItem(storeId,item,kind='COMMERCIAL_PREVIEW') {
    if(commercialSaves[item.id])return {ok:true,item:commercialSaves[item.id],alreadySaved:true};
    const reference=commercialReference(personId,storeId,item,kind);
    setCommercialSaves(current=>({...current,[item.id]:reference}));
    return {ok:true,item:reference};
  }

  function changeWardrobePlan(nextPlanId) {
    const nextPlan = getWardrobePlan(nextPlanId);
    if (nextPlan.limit !== null && wardrobe.length > nextPlan.limit) {
      return { ok: false, reason: 'USAGE_ABOVE_PLAN_LIMIT', plan: nextPlan };
    }

    setWardrobePlanId(nextPlan.id);
    return { ok: true, plan: nextPlan };
  }

  function addStoreItem(storeId, item) {
    if (!user?.contexts?.some(context=>context.store_id===storeId && context.capabilities.includes('catalog.write'))) throw new Error('Catálogo não autorizado');
    const created = { ...item,id: `store-item-${Date.now()}`,kind:'COMMERCIAL_PREVIEW',storeId };
    setStores((current) => current.map((store) => (
      store.id === storeId
        ? { ...store, items: [created, ...store.items] }
        : store
    )));
    return created;
  }

  function addPersonalCollection(collection) {
    const references=collectionReferences(personId,collection.itemIds,wardrobe,commercialSaves);
    const created = { ...collection,id:`collection-${Date.now()}`,personId,version:1,references };
    setPersonalCollections((current) => [created, ...current]);
    return created;
  }

  function updateCampaign(patch) {
    setCampaignState((current) => ({ ...current, ...patch }));
  }

  function toggleCampaignStatus() {
    setCampaignState((current) => ({
      ...current,
      status: current.status === 'active' ? 'paused' : 'active',
    }));
  }

  async function resetDemo() {
    setFavorites({});
    setLikes({});
    setFollowing({});
    setCommercialSaves(seedSaves);
    setWardrobe(seedWardrobe);
    setWardrobePlanId(DEFAULT_WARDROBE_PLAN_ID);
    setPersonalCollections(seedCollections);
    setProfile(seedProfile);
    setStores(cloneStores());
    setDaniState(initialDaniState);
    setCampaignState(initialCampaignState);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  const value = useMemo(
    () => ({
      hydrated,
      favorites,
      likes,
      following,
      commercialSaves,
      wardrobe,
      wardrobePlanId,
      wardrobeCapacity: getWardrobeCapacity(wardrobePlanId, wardrobe.length),
      personalCollections,
      profile,
      stores,
      daniState,
      campaignState,
      toggleFavorite,
      toggleLike,
      like,
      toggleFollowing,
      addWardrobeItem,
      saveCommercialItem,
      changeWardrobePlan,
      addStoreItem,
      addPersonalCollection,



      updateCampaign,
      toggleCampaignStatus,
      setProfile,
      resetDemo,
    }),
    [
      commercialSaves,
      favorites,
      following,
      hydrated,
      likes,
      personalCollections,
      profile,
      stores,
      wardrobe,
      wardrobePlanId,
      daniState,
      campaignState,
    ]
  );

  if (!hydrated) return <View style={{flex:1,alignItems:'center',justifyContent:'center'}}><ActivityIndicator /></View>;
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
