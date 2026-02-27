import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

export const useSafeWords = () => {
    const [customSafeWords, setCustomSafeWords] = useState<string[]>([]);
    const [isSafeWordModalVisible, setIsSafeWordModalVisible] = useState(false);
    const [newSafeWord, setNewSafeWord] = useState("");

    const loadSafeWords = useCallback(async () => {
        try {
            const storedWords = await AsyncStorage.getItem("custom_safe_words");
            if (storedWords) {
                setCustomSafeWords(JSON.parse(storedWords));
            }
        } catch (e) {
            console.log("❌ Failed to load safe words:", e);
        }
    }, []);

    const saveSafeWords = async (updatedWords: string[]) => {
        try {
            await AsyncStorage.setItem("custom_safe_words", JSON.stringify(updatedWords));
            setCustomSafeWords(updatedWords);
        } catch (e) {
            console.log("❌ Failed to save safe words:", e);
        }
    };

    const addSafeWord = () => {
        const trimmed = newSafeWord.trim();
        if (!trimmed) return;
        if (customSafeWords.includes(trimmed)) {
            Alert.alert("Duplicate", "This word is already added.");
            return;
        }
        const updated = [...customSafeWords, trimmed];
        saveSafeWords(updated);
        setNewSafeWord("");
    };

    const deleteSafeWord = (word: string) => {
        const updated = customSafeWords.filter(w => w !== word);
        saveSafeWords(updated);
    };

    useEffect(() => {
        loadSafeWords();
    }, [loadSafeWords]);

    return {
        customSafeWords,
        newSafeWord,
        setNewSafeWord,
        isSafeWordModalVisible,
        setIsSafeWordModalVisible,
        addSafeWord,
        deleteSafeWord,
    };
};
