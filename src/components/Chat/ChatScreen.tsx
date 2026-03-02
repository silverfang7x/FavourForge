import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { ChatMessageModel } from '@models/ChatMessageModel';
import { listMessages, sendMessage, subscribeToMessages } from '@services/ChatService';
import type { RootStackParamList } from '../../navigation';

type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export function ChatScreen({ route, navigation }: ChatScreenProps) {
  const { user, beaconId } = route.params;
  const [messages, setMessages] = useState<ChatMessageModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const listRef = useRef<FlatList<ChatMessageModel> | null>(null);

  useEffect(() => {
    let mounted = true;

    listMessages({ beaconId })
      .then((rows) => {
        if (!mounted) return;
        setMessages(rows);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unknown error';
        Alert.alert('Chat error', message);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    const { unsubscribe } = subscribeToMessages({
      beaconId,
      onNewMessage: (m) => {
        setMessages((prev) => {
          if (prev.some((x) => x.id === m.id)) return prev;
          return [...prev, m];
        });
      },
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [beaconId]);

  useEffect(() => {
    if (messages.length === 0) return;
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages.length]);

  const canSend = useMemo(() => text.trim().length > 0 && !sending, [text, sending]);

  async function onSend() {
    setSending(true);
    try {
      await sendMessage({ beaconId, senderId: user.id, content: text });
      setText('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Send failed', message);
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.title}>Beacon Chat</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {beaconId}
            </Text>
          </View>
        </View>

        <TouchableOpacity accessibilityRole="button" onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Close</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={(r) => {
          listRef.current = r;
        }}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const mine = item.sender_id === user.id;
          return (
            <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowOther]}>
              <View
                style={[styles.bubbleWrap, mine ? styles.bubbleWrapMine : styles.bubbleWrapOther]}
              >
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                  <Text style={mine ? styles.textMine : styles.textOther}>{item.content}</Text>
                </View>
                <View style={[styles.tail, mine ? styles.tailMine : styles.tailOther]} />
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <Text style={styles.empty}>Loading…</Text>
          ) : (
            <Text style={styles.empty}>No messages yet.</Text>
          )
        }
      />

      <View style={styles.composer}>
        <View style={styles.composerInner}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Message…"
            placeholderTextColor="#9ca3af"
            accessibilityLabel="Message input"
            multiline
          />
          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.sendBtn, !canSend ? styles.sendBtnDisabled : styles.sendBtnEnabled]}
            onPress={onSend}
            disabled={!canSend}
          >
            <Text style={styles.sendText}>{sending ? '…' : 'Send'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229,231,235,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 10,
  },
  backBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
  },
  backText: {
    fontWeight: '800',
    color: '#111827',
    fontSize: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  link: {
    fontWeight: '700',
    color: '#111827',
  },
  listContent: {
    padding: 14,
    gap: 12,
  },
  empty: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 20,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  rowMine: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  bubbleWrap: {
    maxWidth: '86%',
  },
  bubbleWrapMine: {
    alignItems: 'flex-end',
  },
  bubbleWrapOther: {
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
  },
  bubbleMine: {
    backgroundColor: '#111827',
  },
  bubbleOther: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(229,231,235,0.9)',
  },
  tail: {
    width: 12,
    height: 12,
    marginTop: -4,
    borderRadius: 3,
    transform: [{ rotate: '45deg' }],
  },
  tailMine: {
    backgroundColor: '#111827',
    marginRight: 10,
  },
  tailOther: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(229,231,235,0.9)',
    marginLeft: 10,
  },
  textMine: {
    color: 'white',
    fontWeight: '600',
  },
  textOther: {
    color: '#111827',
    fontWeight: '600',
  },
  composer: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(229,231,235,0.9)',
  },
  composerInner: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(229,231,235,0.9)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    fontWeight: '600',
    color: '#111827',
    maxHeight: 120,
  },
  sendBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  sendBtnEnabled: {
    backgroundColor: '#111827',
  },
  sendBtnDisabled: {
    backgroundColor: '#9ca3af',
  },
  sendText: {
    color: 'white',
    fontWeight: '900',
  },
});
