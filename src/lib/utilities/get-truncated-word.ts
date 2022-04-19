export const getTruncatedWord = (word: string, width: number): string => {
  if (word.length * 8 > width) {
    const truncLength = Math.floor(width / 8) - 4;
    if (truncLength > 0) {
      const trunc = word.slice(0, truncLength);
      return `${trunc}...`;
    } else {
      return '...';
    }
  }
  return word;
};
