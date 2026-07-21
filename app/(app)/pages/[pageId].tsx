import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../../../context/ThemeContext';
import { usePage } from '../../../hooks/usePages';

// Empty page shell (Phase 0). The freeform canvas — drag/resize/rotate/layer
// photos and decorations on this surface — is Phase 1 and replaces this View.
export default function PageShellScreen() {
  const { pageId } = useLocalSearchParams<{ pageId: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { data: page, isLoading } = usePage(pageId);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={{ color: colors.accent, fontSize: 16 }}>‹ Back</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {page?.title || 'Untitled page'}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color={colors.accent} />
      ) : (
        <View style={[styles.canvas, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.canvasHint, { color: colors.subtleText }]}>
            Blank page — the freeform canvas (photos, stickers, doodles) lands in Phase 1.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  canvas: {
    flex: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginBottom: 24,
  },
  canvasHint: { textAlign: 'center', fontSize: 14, lineHeight: 20 },
});
