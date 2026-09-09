import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDemo } from '../contexts/DemoContext';
import { daniLessons, daniRecommendations } from '../demo/data';
import { colors } from '../theme/colors';

const reviewItemIds = ['wardrobe-bomber', 'wardrobe-calca-areia', 'wardrobe-bag'];

export default function DaniRicoScreen({ navigation }) {
  const {
    daniState,
    requestDaniReview,
    toggleDaniLesson,
    toggleDaniSession,
    wardrobe,
  } = useDemo();
  const [openLesson, setOpenLesson] = useState(null);
  const completedCount = Object.values(daniState.completedLessons).filter(Boolean).length;
  const reviewItems = reviewItemIds
    .map((id) => wardrobe.find((item) => item.id === id))
    .filter(Boolean);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.monogram}><Text style={styles.monogramText}>DR</Text></View>
          <View style={styles.online}><View style={styles.onlineDot} /><Text style={styles.onlineText}>DEMONSTRAÇÃO</Text></View>
        </View>
        <Text style={styles.eyebrow}>PAINEL DANI RICO • DEMO</Text>
        <Text style={styles.title}>Estilo que encontra a vida real.</Text>
        <Text style={styles.intro}>
          Exemplos de interface. Conteúdo demonstrativo; atendimento e agenda não estão conectados.
        </Text>
        <Text style={styles.signature}>Dani Rico  •  especialista em imagem e estilo</Text>
      </View>

      <View style={styles.metrics}>
        <Metric value={`${completedCount}/${daniLessons.length}`} label="aulas concluídas" />
        <Metric value={daniState.lookReview ? '1' : '0'} label="pareceres" />
        <Metric value={daniState.sessionBooked ? '✓' : '—'} label="sessão marcada" />
      </View>

      <SectionHeading number="01" eyebrow="ACOMPANHAMENTO" title="Seu próximo encontro" />
      <View style={styles.sessionCard}>
        <View style={styles.dateBlock}>
          <Text style={styles.dateDay}>28</Text>
          <Text style={styles.dateMonth}>AGO</Text>
        </View>
        <View style={styles.sessionCopy}>
          <Text style={styles.sessionTitle}>Sessão de direcionamento</Text>
          <Text style={styles.sessionMeta}>19h30  •  vídeo  •  45 minutos</Text>
          <Text style={styles.sessionDescription}>Revisão de objetivos, rotina e evolução do armário.</Text>
        </View>
        <Pressable
          style={[styles.sessionButton, daniState.sessionBooked && styles.sessionButtonActive]}
          onPress={toggleDaniSession}
        >
          <Text style={styles.sessionButtonText}>
            {daniState.sessionBooked ? '✓ RESERVA SIMULADA' : 'SIMULAR RESERVA →'}
          </Text>
        </Pressable>
      </View>

      <SectionHeading number="02" eyebrow="TRILHA EXCLUSIVA" title="Aulas com aplicação" />
      <Text style={styles.sectionIntro}>Abra uma aula e marque a conclusão para acompanhar o progresso.</Text>
      {daniLessons.map((lesson) => {
        const complete = Boolean(daniState.completedLessons[lesson.id]);
        const expanded = openLesson === lesson.id;
        return (
          <View key={lesson.id} style={[styles.lesson, complete && styles.lessonComplete]}>
            <Pressable style={styles.lessonHeader} onPress={() => setOpenLesson(expanded ? null : lesson.id)}>
              <Text style={[styles.lessonNumber, complete && styles.lessonNumberComplete]}>{complete ? '✓' : lesson.number}</Text>
              <View style={styles.lessonCopy}>
                <Text style={styles.lessonLevel}>{lesson.level}  •  {lesson.duration}</Text>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                <Text style={styles.lessonDescription}>{lesson.description}</Text>
              </View>
              <Text style={styles.lessonArrow}>{expanded ? '−' : '+'}</Text>
            </Pressable>
            {expanded ? (
              <View style={styles.lessonBody}>
                <Text style={styles.lessonVideo}>▶  PRÉVIA DA AULA DISPONÍVEL</Text>
                <Text style={styles.lessonExercise}>Exercício: escolha três peças do armário e registre duas combinações com funções diferentes.</Text>
                <Pressable style={styles.lessonButton} onPress={() => toggleDaniLesson(lesson.id)}>
                  <Text style={styles.lessonButtonText}>{complete ? 'REABRIR AULA' : 'MARCAR COMO CONCLUÍDA ✓'}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        );
      })}

      <SectionHeading number="03" eyebrow="REVISÃO INDIVIDUAL" title="Dani revisa seu look" />
      <View style={styles.reviewCard}>
        <Text style={styles.reviewOccasion}>LOOK SELECIONADO  •  REUNIÃO IMPORTANTE</Text>
        <View style={styles.lookRow}>
          {reviewItems.map((item) => <Image key={item.id} source={item.image} style={styles.lookImage} />)}
        </View>
        {daniState.lookReview ? (
          <View style={styles.feedback}>
            <Text style={styles.feedbackTag}>PARECER DEMONSTRATIVO</Text>
            <Text style={styles.feedbackTitle}>{daniState.lookReview.title}</Text>
            <Text style={styles.feedbackText}>{daniState.lookReview.summary}</Text>
            <Text style={styles.feedbackSuggestion}>DICA PRÁTICA  •  {daniState.lookReview.suggestion}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.reviewCopy}>Envie esta combinação para receber uma análise de proporção, cor e adequação à ocasião.</Text>
            <Pressable style={styles.reviewButton} onPress={requestDaniReview}>
              <Text style={styles.reviewButtonText}>ENVIAR LOOK PARA REVISÃO →</Text>
            </Pressable>
          </>
        )}
      </View>

      <SectionHeading number="04" eyebrow="CURADORIA DA ESPECIALISTA" title="Indicações para você" />
      <Text style={styles.sectionIntro}>Sugestões baseadas nas peças e medidas salvas no seu perfil.</Text>
      {daniRecommendations.map((recommendation) => {
        const item = wardrobe.find((piece) => piece.id === recommendation.itemId);
        if (!item) return null;
        return (
          <Pressable
            key={recommendation.id}
            style={styles.recommendation}
            onPress={() => navigation.navigate('Peça recomendada', { itemId: item.id })}
          >
            <Image source={item.image} style={styles.recommendationImage} />
            <View style={styles.recommendationCopy}>
              <Text style={styles.recommendationOccasion}>{recommendation.occasion}</Text>
              <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
              <Text style={styles.recommendationText}>{recommendation.note}</Text>
              <Text style={styles.recommendationLink}>VER PEÇA EM 2D + 3D →</Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function Metric({ value, label }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function SectionHeading({ number, eyebrow, title }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionNumber}>{number}</Text>
      <View>
        <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },
  hero: { backgroundColor: colors.primary, padding: 22, paddingTop: 28, paddingBottom: 30 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 },
  monogram: { width: 58, height: 58, borderRadius: 29, borderWidth: 1, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  monogramText: { color: colors.gold, fontFamily: 'serif', fontSize: 20, fontWeight: '900' },
  online: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#49443E', paddingHorizontal: 9, paddingVertical: 6 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#A9D19E', marginRight: 6 },
  onlineText: { color: colors.bg, fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  eyebrow: { color: colors.gold, fontSize: 8, fontWeight: '900', letterSpacing: 2 },
  title: { color: colors.bg, fontFamily: 'serif', fontSize: 37, lineHeight: 41, marginTop: 7 },
  intro: { color: colors.line, fontSize: 12, lineHeight: 19, marginTop: 10, maxWidth: 330 },
  signature: { color: colors.gold, fontSize: 8, fontWeight: '800', letterSpacing: 0.8, marginTop: 17 },
  metrics: { marginHorizontal: 18, flexDirection: 'row', borderWidth: 1, borderColor: colors.line },
  metric: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  metricValue: { color: colors.accent, fontFamily: 'serif', fontSize: 22, fontWeight: '900' },
  metricLabel: { color: colors.muted, fontSize: 6, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase', textAlign: 'center' },
  sectionHeading: { marginHorizontal: 18, marginTop: 31, flexDirection: 'row', alignItems: 'center', gap: 11 },
  sectionNumber: { color: colors.bg, backgroundColor: colors.accent, paddingHorizontal: 9, paddingVertical: 8, fontSize: 9, fontWeight: '900' },
  sectionEyebrow: { color: colors.accent, fontSize: 7, fontWeight: '900', letterSpacing: 1.5 },
  sectionTitle: { color: colors.text, fontFamily: 'serif', fontSize: 25, marginTop: 2 },
  sectionIntro: { marginHorizontal: 18, color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 8, marginBottom: 13 },
  sessionCard: { margin: 18, marginBottom: 0, borderWidth: 1, borderColor: colors.line, padding: 15 },
  dateBlock: { position: 'absolute', top: 15, left: 15, width: 54, height: 58, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  dateDay: { color: colors.bg, fontFamily: 'serif', fontSize: 25, fontWeight: '900' },
  dateMonth: { color: colors.bg, fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  sessionCopy: { paddingLeft: 67, minHeight: 67 },
  sessionTitle: { color: colors.text, fontFamily: 'serif', fontSize: 20 },
  sessionMeta: { color: colors.accent, fontSize: 8, fontWeight: '900', marginTop: 4 },
  sessionDescription: { color: colors.muted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  sessionButton: { marginTop: 13, backgroundColor: colors.primary, padding: 13, alignItems: 'center' },
  sessionButtonActive: { backgroundColor: colors.accent },
  sessionButtonText: { color: colors.bg, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  lesson: { marginHorizontal: 18, borderTopWidth: 1, borderColor: colors.line },
  lessonComplete: { borderColor: colors.accent },
  lessonHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  lessonNumber: { width: 35, color: colors.accent, fontSize: 17, fontWeight: '900' },
  lessonNumberComplete: { color: colors.gold },
  lessonCopy: { flex: 1 },
  lessonLevel: { color: colors.accent, fontSize: 7, fontWeight: '900', letterSpacing: 0.9, textTransform: 'uppercase' },
  lessonTitle: { color: colors.text, fontFamily: 'serif', fontSize: 20, marginTop: 3 },
  lessonDescription: { color: colors.muted, fontSize: 9, lineHeight: 14, marginTop: 3 },
  lessonArrow: { color: colors.accent, fontSize: 22, marginLeft: 8 },
  lessonBody: { backgroundColor: colors.surface, padding: 14, marginBottom: 12 },
  lessonVideo: { color: colors.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  lessonExercise: { color: colors.muted, fontSize: 10, lineHeight: 16, marginTop: 8 },
  lessonButton: { borderWidth: 1, borderColor: colors.accent, padding: 11, alignItems: 'center', marginTop: 11 },
  lessonButtonText: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 0.9 },
  reviewCard: { margin: 18, marginBottom: 0, backgroundColor: colors.surface, padding: 15, borderLeftWidth: 4, borderLeftColor: colors.gold },
  reviewOccasion: { color: colors.gold, fontSize: 7, fontWeight: '900', letterSpacing: 1.1 },
  lookRow: { flexDirection: 'row', gap: 7, marginTop: 12 },
  lookImage: { flex: 1, height: 125, backgroundColor: colors.bg },
  reviewCopy: { color: colors.muted, fontSize: 10, lineHeight: 16, marginTop: 12 },
  reviewButton: { backgroundColor: colors.accent, padding: 13, alignItems: 'center', marginTop: 12 },
  reviewButtonText: { color: colors.bg, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  feedback: { marginTop: 13, borderTopWidth: 1, borderColor: colors.line, paddingTop: 13 },
  feedbackTag: { color: colors.accent, fontSize: 7, fontWeight: '900', letterSpacing: 1.1 },
  feedbackTitle: { color: colors.text, fontFamily: 'serif', fontSize: 23, marginTop: 5 },
  feedbackText: { color: colors.muted, fontSize: 11, lineHeight: 18, marginTop: 6 },
  feedbackSuggestion: { color: colors.text, fontSize: 9, lineHeight: 15, fontWeight: '800', marginTop: 10 },
  recommendation: { marginHorizontal: 18, marginBottom: 16, borderTopWidth: 1, borderColor: colors.line, paddingTop: 13, flexDirection: 'row' },
  recommendationImage: { width: 112, height: 145, backgroundColor: colors.surface },
  recommendationCopy: { flex: 1, paddingLeft: 13 },
  recommendationOccasion: { color: colors.accent, fontSize: 7, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  recommendationTitle: { color: colors.text, fontFamily: 'serif', fontSize: 20, marginTop: 5 },
  recommendationText: { color: colors.muted, fontSize: 9, lineHeight: 15, marginTop: 5 },
  recommendationLink: { color: colors.accent, fontSize: 7, fontWeight: '900', letterSpacing: 0.8, marginTop: 10 },
});
