import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '../../../context/AuthContext';
import { useAppTheme } from '../../../context/ThemeContext';
import {
  useCreateJournal,
  useDeleteJournal,
  useJournals,
  useRenameJournal,
  useReorderJournals,
} from '../../../hooks/useJournals';
import type { Journal } from '../../../types/database';

function JournalRow({
  journal,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
}: {
  journal: Journal;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const renameJournal = useRenameJournal();
  const deleteJournal = useDeleteJournal();
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(journal.title);

  const commitRename = () => {
    setIsEditing(false);
    const title = draftTitle.trim();
    if (title && title !== journal.title) {
      renameJournal.mutate({ id: journal.id, title });
    } else {
      setDraftTitle(journal.title);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete journal', `Delete "${journal.title}"? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteJournal.mutate(journal.id) },
    ]);
  };

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable
        style={styles.rowMain}
        onPress={() => router.push(`/(app)/journals/${journal.id}`)}
        disabled={isEditing}
      >
        {isEditing ? (
          <TextInput
            style={[styles.rowTitleInput, { color: colors.text, borderColor: colors.border }]}
            value={draftTitle}
            onChangeText={setDraftTitle}
            onBlur={commitRename}
            onSubmitEditing={commitRename}
            autoFocus
          />
        ) : (
          <Text style={[styles.rowTitle, { color: colors.text }]}>{journal.title}</Text>
        )}
        <Text style={[styles.rowSubtitle, { color: colors.subtleText }]}>{journal.type}</Text>
      </Pressable>

      <View style={styles.rowActions}>
        <Pressable onPress={onMoveUp} disabled={isFirst} hitSlop={8}>
          <Text style={[styles.actionText, { color: isFirst ? colors.border : colors.accent }]}>↑</Text>
        </Pressable>
        <Pressable onPress={onMoveDown} disabled={isLast} hitSlop={8}>
          <Text style={[styles.actionText, { color: isLast ? colors.border : colors.accent }]}>↓</Text>
        </Pressable>
        <Pressable onPress={() => setIsEditing(true)} hitSlop={8}>
          <Text style={[styles.actionText, { color: colors.accent }]}>Rename</Text>
        </Pressable>
        <Pressable onPress={confirmDelete} hitSlop={8}>
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function JournalsScreen() {
  const { colors, resolvedMode, toggle } = useAppTheme();
  const { signOut } = useAuth();
  const { data: journals, isLoading } = useJournals();
  const createJournal = useCreateJournal();
  const reorderJournals = useReorderJournals();
  const [newTitle, setNewTitle] = useState('');

  const onCreate = () => {
    const title = newTitle.trim();
    if (!title) return;
    createJournal.mutate({ title, type: 'custom' });
    setNewTitle('');
  };

  const move = (index: number, direction: -1 | 1) => {
    if (!journals) return;
    const target = index + direction;
    if (target < 0 || target >= journals.length) return;
    const ids = journals.map((j) => j.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderJournals.mutate(ids);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Your Journals</Text>
        <View style={styles.headerActions}>
          <Text style={{ color: colors.subtleText }}>{resolvedMode === 'dark' ? '🌙' : '☀️'}</Text>
          <Switch value={resolvedMode === 'dark'} onValueChange={toggle} />
          <Pressable onPress={() => signOut()} hitSlop={8}>
            <Text style={{ color: colors.accent }}>Sign out</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.createRow}>
        <TextInput
          style={[styles.createInput, { borderColor: colors.border, color: colors.text }]}
          placeholder="New journal title"
          placeholderTextColor={colors.subtleText}
          value={newTitle}
          onChangeText={setNewTitle}
          onSubmitEditing={onCreate}
        />
        <Pressable style={[styles.createButton, { backgroundColor: colors.accent }]} onPress={onCreate}>
          <Text style={styles.createButtonText}>Add</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color={colors.accent} />
      ) : (
        <FlatList
          data={journals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.subtleText }]}>
              No journals yet — create your first one above.
            </Text>
          }
          renderItem={({ item, index }) => (
            <JournalRow
              journal={item}
              isFirst={index === 0}
              isLast={index === (journals?.length ?? 1) - 1}
              onMoveUp={() => move(index, -1)}
              onMoveDown={() => move(index, 1)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  createRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  createInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  createButton: { borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  createButtonText: { color: '#fff', fontWeight: '600' },
  list: { gap: 10, paddingBottom: 40 },
  empty: { textAlign: 'center', marginTop: 40 },
  row: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 10 },
  rowMain: { gap: 2 },
  rowTitle: { fontSize: 17, fontWeight: '600' },
  rowTitleInput: { fontSize: 17, fontWeight: '600', borderBottomWidth: 1, paddingVertical: 2 },
  rowSubtitle: { fontSize: 13, textTransform: 'capitalize' },
  rowActions: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  actionText: { fontWeight: '600' },
  deleteText: { color: '#C0392B', fontWeight: '600' },
});
