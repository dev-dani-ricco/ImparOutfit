import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  initialPersonalCollections,
  initialProfile,
  initialWardrobe,
} from '../demo/data';

const DemoContext = createContext(null);

export const useDemo = () => useContext(DemoContext);

export function DemoProvider({ children }) {
  const [favorites, setFavorites] = useState({});
  const [likes, setLikes] = useState({});
  const [following, setFollowing] = useState({});
  const [wardrobe, setWardrobe] = useState(initialWardrobe);
  const [personalCollections, setPersonalCollections] = useState(initialPersonalCollections);
  const [profile, setProfile] = useState(initialProfile);

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
    setWardrobe((current) => [{ id: `wardrobe-${Date.now()}`, ...item }, ...current]);
  }

  function addPersonalCollection(collection) {
    setPersonalCollections((current) => [
      { id: `collection-${Date.now()}`, ...collection },
      ...current,
    ]);
  }

  const value = useMemo(
    () => ({
      favorites,
      likes,
      following,
      wardrobe,
      personalCollections,
      profile,
      toggleFavorite,
      toggleLike,
      like,
      toggleFollowing,
      addWardrobeItem,
      addPersonalCollection,
      setProfile,
    }),
    [favorites, likes, following, wardrobe, personalCollections, profile]
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
