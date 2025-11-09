# -*- coding: utf-8 -*-
"""
Морфологический анализ для минусации и дублей
Использует pymorphy3 для лемматизации
"""

try:
    import pymorphy3
    MORPH_AVAILABLE = True
    morph = pymorphy3.MorphAnalyzer()
except ImportError:
    MORPH_AVAILABLE = False
    morph = None


def lemmatize_word(word: str) -> str:
    """Получить лемму слова (начальная форма)"""
    if not MORPH_AVAILABLE or not word:
        return word.lower()

    try:
        parsed = morph.parse(word.lower())[0]
        return parsed.normal_form
    except Exception:
        return word.lower()


def lemmatize_phrase(phrase: str) -> str:
    """Получить леммы всех слов в фразе"""
    words = phrase.split()
    lemmas = [lemmatize_word(w) for w in words]
    return ' '.join(lemmas)


def are_morphological_duplicates(phrase1: str, phrase2: str) -> bool:
    """Проверить являются ли фразы морфологическими дублями"""
    lemma1 = lemmatize_phrase(phrase1)
    lemma2 = lemmatize_phrase(phrase2)
    return lemma1 == lemma2


def match_stopword(phrase: str, stopword: str, mode: str = 'partial') -> bool:
    """
    Проверить совпадение стоп-слова с фразой

    mode:
    - 'exact': точное совпадение фразы
    - 'partial': частичное вхождение
    - 'independent': независимое вхождение (целое слово)
    - 'morphological': морфонезависимое (по леммам)
    """
    phrase_lower = phrase.lower()
    stopword_lower = stopword.lower()

    if mode == 'exact':
        return phrase_lower == stopword_lower

    elif mode == 'partial':
        return stopword_lower in phrase_lower

    elif mode == 'independent':
        phrase_words = set(phrase_lower.split())
        return stopword_lower in phrase_words

    elif mode == 'morphological':
        if not MORPH_AVAILABLE:
            # Fallback на независимое вхождение
            return stopword_lower in set(phrase_lower.split())

        phrase_lemmas = set(lemmatize_phrase(phrase).split())
        stopword_lemma = lemmatize_word(stopword)
        return stopword_lemma in phrase_lemmas

    return False


def filter_by_stopwords(phrases: list[str], stopwords: list[str], mode: str = 'partial') -> list[str]:
    """
    Отфильтровать фразы по стоп-словам

    Возвращает список фраз БЕЗ стоп-слов
    """
    filtered = []
    for phrase in phrases:
        has_stopword = False
        for stopword in stopwords:
            if match_stopword(phrase, stopword, mode):
                has_stopword = True
                break

        if not has_stopword:
            filtered.append(phrase)

    return filtered
