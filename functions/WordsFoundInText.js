export const wordsFoundInText = (text, words) => {
    return words.some(word => text.toLowerCase().includes(word.toLowerCase()));
};
