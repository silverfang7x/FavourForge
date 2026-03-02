import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const T = {
    primary: '#6C63FF',
    primaryLight: '#EDE9FE',
    bg: '#F8F9FA',
    card: '#FFFFFF',
    text: '#1A1A2E',
    muted: '#6B7280',
    border: '#E5E7EB',
};

type Props = {
    navigation: any;
};

export function EditProfileScreen({ navigation }: Props) {
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [phone, setPhone] = useState('');
    const [location, setLocation] = useState('');
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        setSaving(true);
        // TODO: wire to Supabase profile update
        await new Promise((r) => setTimeout(r, 800));
        setSaving(false);
        Alert.alert('Saved!', 'Your profile has been updated.', [
            { text: 'OK', onPress: () => navigation.goBack() },
        ]);
    }

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.select({ ios: 'padding', android: undefined })}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>‹ Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Avatar placeholder */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarEmoji}>🧑‍💻</Text>
                    </View>
                    <TouchableOpacity style={styles.changePhotoBtn} activeOpacity={0.7}>
                        <Text style={styles.changePhotoText}>Change Photo</Text>
                    </TouchableOpacity>
                </View>

                {/* Form */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>PERSONAL DETAILS</Text>

                    <Text style={styles.label}>Full Name</Text>
                    <View style={styles.inputWrap}>
                        <Text style={styles.inputIcon}>👤</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="e.g. Alex Johnson"
                            placeholderTextColor="#9CA3AF"
                            autoCapitalize="words"
                        />
                    </View>

                    <Text style={styles.label}>Bio</Text>
                    <View style={[styles.inputWrap, styles.inputWrapMulti]}>
                        <TextInput
                            style={[styles.input, styles.inputMulti]}
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Tell the community a little about yourself…"
                            placeholderTextColor="#9CA3AF"
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>

                    <Text style={styles.label}>Phone Number</Text>
                    <View style={styles.inputWrap}>
                        <Text style={styles.inputIcon}>📞</Text>
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="+1 (555) 000-0000"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <Text style={styles.label}>Location</Text>
                    <View style={styles.inputWrap}>
                        <Text style={styles.inputIcon}>📍</Text>
                        <TextInput
                            style={styles.input}
                            value={location}
                            onChangeText={setLocation}
                            placeholder="City, State"
                            placeholderTextColor="#9CA3AF"
                            autoCapitalize="words"
                        />
                    </View>
                </View>

                {/* Save button */}
                <Pressable
                    style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    <Text style={styles.saveBtnText}>{saving ? '⏳ Saving…' : '💾 Save Changes'}</Text>
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: T.bg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 16,
        paddingBottom: 14,
        backgroundColor: T.card,
        borderBottomWidth: 1,
        borderBottomColor: T.border,
    },
    backBtn: {
        width: 60,
    },
    backBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: T.primary,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '900',
        color: T.text,
    },
    scroll: {
        padding: 20,
        gap: 16,
    },
    avatarSection: {
        alignItems: 'center',
        gap: 10,
        marginBottom: 4,
    },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: T.primaryLight,
        borderWidth: 3,
        borderColor: T.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarEmoji: {
        fontSize: 42,
    },
    changePhotoBtn: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: T.primaryLight,
    },
    changePhotoText: {
        fontSize: 13,
        fontWeight: '700',
        color: T.primary,
    },
    card: {
        backgroundColor: T.card,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: T.border,
        gap: 4,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: T.muted,
        letterSpacing: 0.8,
        marginBottom: 8,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: T.muted,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginTop: 12,
        marginBottom: 6,
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: T.bg,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: T.border,
        paddingHorizontal: 14,
        gap: 10,
    },
    inputWrapMulti: {
        alignItems: 'flex-start',
        paddingTop: 12,
        paddingBottom: 8,
    },
    inputIcon: {
        fontSize: 16,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 15,
        fontWeight: '600',
        color: T.text,
    },
    inputMulti: {
        paddingVertical: 0,
        minHeight: 72,
    },
    saveBtn: {
        backgroundColor: T.primary,
        borderRadius: 18,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: T.primary,
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
    },
    saveBtnPressed: {
        opacity: 0.85,
        transform: [{ scale: 0.97 }],
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFFFFF',
    },
});
