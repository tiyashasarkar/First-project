import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../../../context/ThemeContext';
import { useCreatePage, usePages } from '../../../hooks/usePages';

export default function JournalDetailScreen() {
  const { journalId } = useLocalSearchParams<{ journalId: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { data: pages, isLoading } = usePages(journalId);
  const createPage = useCreatePage(journalId);

  const onNewPage = async () => {
    const page = await createPage.mutateAsync();
    router.push(`/(app)/pages/${page.id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={{ color: colors.accent, fontSize: 16 }}>‹ Journals</Text>
        </Pressable>
        <Pressable style={[styles.newButton, { backgroundColor: colors.accent }]} onPress={onNewPage}>
          <Text style={styles.newButtonText}>+ New page</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color={colors.accent} />
      ) : (
        <FlatList
          data={pages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.subtleText }]}>
              No pages yet — tap "New page" to start your first blank canvas.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push(`/(app)/pages/${item.id}`)}
            >
              <Text style={[styles.rowTitle, { color: colors.text }]}>{item.title || 'Untitled page'}</Text>
              <Text style={[styles.rowSubtitle, { color: colors.subtleText }]}>{item.date}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  newButton: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  newButtonText: { color: '#fff', fontWeight: '600' },
  list: { gap: 10, paddingBottom: 40 },
  empty: { textAlign: 'center', marginTop: 40 },
  row: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 4 },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowSubtitle: { fontSize: 13 },
});
