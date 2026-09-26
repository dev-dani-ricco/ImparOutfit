import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { useDemo } from '../contexts/DemoContext';
import { colors } from '../theme/colors';

export default function HomeScreen({ navigation }) {
  const { user, demoMode, logout } = useAuth();
  const { profile, wardrobe, personalCollections, commercialSaves } = useDemo();
  const firstName = String(profile?.name || user?.name || 'Você').trim().split(/\s+/)[0];
  const avatarReady = Boolean(profile?.avatarConfiguredAt);
  const recentPieces = useMemo(() => wardrobe.slice(0, 3), [wardrobe]);

  const go = async (tab, screen, params) => {
    await Haptics.selectionAsync().catch(() => {});
    if (screen) navigation.navigate(tab, { screen, params });
    else navigation.navigate(tab);
  };

  const changeJourney = async () => {
    await Haptics.selectionAsync().catch(() => {});
    if (demoMode) await logout();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Text style={styles.brand}>IMPAR OUTFIT</Text>
          <View style={styles.contextBadge}><Text style={styles.contextBadgeText}>CLIENTE FINAL</Text></View>
        </View>
        {demoMode ? <Pressable onPress={changeJourney}><Text style={styles.changeJourney}>TROCAR JORNADA →</Text></Pressable> : null}
        <Text style={styles.kicker}>SEU UNIVERSO PESSOAL</Text>
        <Text style={styles.title}>Vista melhor o que já é seu.</Text>
        <Text style={styles.subtitle}>
          Seu avatar, seu guarda-roupa e seus Looks trabalham juntos para transformar escolha em presença.
        </Text>

        <View style={styles.identityRow}>
          <View style={styles.identityCopy}>
            <Text style={styles.hello}>Olá, {firstName}.</Text>
            <Text style={styles.identityText}>
              {avatarReady
                ? 'Seu avatar está ativo. Você pode atualizá-lo sempre que suas medidas ou identidade mudarem.'
                : 'Seu primeiro passo é criar um único avatar pessoal. Ele será a base do armário, dos Looks e das análises.'}
            </Text>
          </View>
          {profile?.profilePhoto ? <Image source={profile.profilePhoto} style={styles.photo} contentFit="cover" transition={140} cachePolicy="memory-disk" /> : <View style={styles.photoPlaceholder}><Text style={styles.photoInitial}>{firstName.charAt(0)}</Text></View>}
        </View>

        <Pressable
          style={avatarReady ? styles.secondaryHeroButton : styles.primaryHeroButton}
          onPress={() => go('Perfil', 'Avatar Studio')}
        >
          <Text style={avatarReady ? styles.secondaryHeroButtonText : styles.primaryHeroButtonText}>
            {avatarReady ? 'ATUALIZAR MEU AVATAR →' : 'CRIAR MEU AVATAR →'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.metrics}>
        <Metric value={wardrobe.length} label="PEÇAS" />
        <Metric value={personalCollections.length} label="LOOKS" />
        <Metric value={Object.keys(commercialSaves || {}).length} label="REFERÊNCIAS" />
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>GUARDA-ROUPA PRIMEIRO</Text>
          <Text style={styles.sectionTitle}>O centro do seu IMPAR Outfit.</Text>
        </View>
        <Pressable onPress={() => go('Armário')}><Text style={styles.link}>ABRIR →</Text></Pressable>
      </View>

      <View style={styles.actionGrid}>
        <ActionCard
          index="01"
          title="Catalogar peça"
          copy="Adicione uma peça física ao seu acervo digital."
          emphasis
          onPress={() => go('Armário', 'Nova peça')}
        />
        <ActionCard
          index="02"
          title="Montar Look"
          copy="Combine peças próprias e referências sem perder a origem."
          onPress={() => go('Armário', 'Nova coleção')}
        />
        <ActionCard
          index="03"
          title="Análise IMPAR"
          copy="Leve um Look para uma análise governada pelo ecossistema Dani."
          onPress={() => go('Análise')}
        />
        <ActionCard
          index="04"
          title="Descobrir"
          copy="Explore marcas e referências sem confundir inspiração com posse."
          onPress={() => go('Descobrir')}
        />
      </View>

      <View style={styles.collectionPanel}>
        <View style={styles.sectionHeaderCompact}>
          <View>
            <Text style={styles.sectionEyebrow}>SEU ACERVO</Text>
            <Text style={styles.sectionTitleSmall}>{wardrobe.length ? 'Últimas peças' : 'Seu armário começa vazio'}</Text>
          </View>
          <Pressable onPress={() => go('Armário')}><Text style={styles.link}>VER TUDO →</Text></Pressable>
        </View>

        {recentPieces.length ? (
          <View style={styles.pieceRow}>
            {recentPieces.map((piece) => (
              <Pressable
                key={piece.id}
                style={styles.pieceCard}
                onPress={() => go('Armário', 'Peça 2D e 3D', { itemId: piece.id })}
              >
                {piece.image ? <Image source={piece.image} style={styles.pieceImage} contentFit="cover" transition={160} cachePolicy="memory-disk" /> : <View style={styles.pieceImagePlaceholder} />}
                <Text numberOfLines={1} style={styles.pieceName}>{piece.name}</Text>
                <Text numberOfLines={1} style={styles.pieceMeta}>{piece.category || piece.color || 'Peça'}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nenhuma peça catalogada.</Text>
            <Text style={styles.emptyCopy}>Crie seu avatar e depois comece pelo que você já possui.</Text>
          </View>
        )}
      </View>

      <View style={styles.futurePanel}>
        <Text style={styles.futureEyebrow}>EVOLUÇÃO 3D</Text>
        <Text style={styles.futureTitle}>Do armário real ao provador digital.</Text>
        <Text style={styles.futureCopy}>
          A fundação já prevê captura multivista, reconstrução de peças, quality gate e composição. O MVP trabalha com caimento aproximado; alta fidelidade é uma evolução posterior.
        </Text>
      </View>
    </ScrollView>
  );
}

function Metric({ value, label }) {
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function ActionCard({ index, title, copy, onPress, emphasis }) {
  return (
    <Pressable style={[styles.actionCard, emphasis && styles.actionCardEmphasis]} onPress={onPress}>
      <Text style={[styles.actionIndex, emphasis && styles.actionIndexEmphasis]}>{index}</Text>
      <View>
        <Text style={[styles.actionTitle, emphasis && styles.actionTitleEmphasis]}>{title}</Text>
        <Text style={[styles.actionCopy, emphasis && styles.actionCopyEmphasis]}>{copy}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F3EE' },
  content: { paddingBottom: 110 },
  hero: { backgroundColor: '#0B0B0C', paddingHorizontal: 22, paddingTop: 34, paddingBottom: 28 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  brand: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 3.4 },
  contextBadge: { borderWidth: 1, borderColor: '#5B4D3E', paddingHorizontal: 9, paddingVertical: 6 },
  contextBadgeText: { color: colors.gold, fontSize: 7, fontWeight: '900', letterSpacing: 1.2 },
  changeJourney: { color: '#8F8881', fontSize: 7, fontWeight: '900', letterSpacing: 1, textAlign: 'right', marginTop: 8 },
  kicker: { color: colors.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.8, marginTop: 24 },
  title: { color: '#FFFFFF', fontFamily: 'serif', fontSize: 42, lineHeight: 45, marginTop: 8, maxWidth: 330 },
  subtitle: { color: '#C8C0B7', fontSize: 13, lineHeight: 20, marginTop: 12, maxWidth: 350 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 28, paddingTop: 18, borderTopWidth: 1, borderTopColor: '#292929' },
  identityCopy: { flex: 1 },
  hello: { color: '#FFFFFF', fontFamily: 'serif', fontSize: 22 },
  identityText: { color: '#AFA79E', fontSize: 11, lineHeight: 17, marginTop: 4 },
  photo: { width: 54, height: 54, borderRadius: 27, borderWidth: 1, borderColor: colors.gold },
  photoPlaceholder: { width: 54, height: 54, borderRadius: 27, borderWidth: 1, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  photoInitial: { color: colors.gold, fontFamily: 'serif', fontSize: 24 },
  primaryHeroButton: { marginTop: 18, backgroundColor: '#FFFFFF', paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center' },
  primaryHeroButtonText: { color: '#0B0B0C', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  secondaryHeroButton: { marginTop: 18, borderWidth: 1, borderColor: '#6D253B', paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center' },
  secondaryHeroButtonText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  metrics: { flexDirection: 'row', marginHorizontal: 18, marginTop: -1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E3DBD2' },
  metric: { flex: 1, paddingVertical: 18, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#E3DBD2' },
  metricValue: { color: '#151515', fontFamily: 'serif', fontSize: 28 },
  metricLabel: { color: '#7E746A', fontSize: 7, fontWeight: '900', letterSpacing: 1.1, marginTop: 3 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginHorizontal: 18, marginTop: 30, marginBottom: 14, gap: 12 },
  sectionHeaderCompact: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, marginBottom: 14 },
  sectionEyebrow: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  sectionTitle: { color: '#151515', fontFamily: 'serif', fontSize: 28, lineHeight: 31, marginTop: 4, maxWidth: 280 },
  sectionTitleSmall: { color: '#151515', fontFamily: 'serif', fontSize: 23, marginTop: 4 },
  link: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  actionGrid: { marginHorizontal: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: { width: '48.5%', minHeight: 166, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E3DBD2', padding: 15, justifyContent: 'space-between' },
  actionCardEmphasis: { backgroundColor: colors.accent, borderColor: colors.accent },
  actionIndex: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1.3 },
  actionIndexEmphasis: { color: '#E9C9D2' },
  actionTitle: { color: '#151515', fontFamily: 'serif', fontSize: 22 },
  actionTitleEmphasis: { color: '#FFFFFF' },
  actionCopy: { color: '#786F67', fontSize: 10, lineHeight: 15, marginTop: 5 },
  actionCopyEmphasis: { color: '#F1DCE2' },
  collectionPanel: { margin: 18, marginTop: 28, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E3DBD2', padding: 16 },
  pieceRow: { flexDirection: 'row', gap: 10 },
  pieceCard: { flex: 1, minWidth: 0 },
  pieceImage: { width: '100%', aspectRatio: 0.82, backgroundColor: '#EFEAE3' },
  pieceImagePlaceholder: { width: '100%', aspectRatio: 0.82, backgroundColor: '#EFEAE3' },
  pieceName: { color: '#151515', fontFamily: 'serif', fontSize: 15, marginTop: 8 },
  pieceMeta: { color: '#81776D', fontSize: 8, marginTop: 2 },
  empty: { paddingVertical: 26, borderTopWidth: 1, borderTopColor: '#EEE8E2' },
  emptyTitle: { color: '#151515', fontFamily: 'serif', fontSize: 19 },
  emptyCopy: { color: '#81776D', fontSize: 11, lineHeight: 17, marginTop: 5 },
  futurePanel: { marginHorizontal: 18, backgroundColor: '#EDE5DC', padding: 20, borderLeftWidth: 3, borderLeftColor: colors.gold },
  futureEyebrow: { color: colors.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  futureTitle: { color: '#151515', fontFamily: 'serif', fontSize: 25, marginTop: 6 },
  futureCopy: { color: '#655D55', fontSize: 11, lineHeight: 18, marginTop: 7 },
});
