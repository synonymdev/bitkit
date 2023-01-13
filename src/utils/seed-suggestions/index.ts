import fuzzysort from 'fuzzysort';
import { patienceDiff } from './PatienceDiff';

type Cache = {
	[key: string]: number | undefined;
};

let cache: Cache = {};

/**
 * Suggests options to complete the seed word. Steps:
 * 1. simple .startsWith() function
 * 2. fuzzysort
 * 3. custom patienceSort() function based on patienceDiff
 */
export default function seedSuggestions(
	origWord: string,
	wordlist: string[],
	numberOfWords = 3,
): Array<string> {
	const word = origWord.toLowerCase().trim();

	// 1. let's find words with that have same beggining
	let result: Array<string> = wordlist
		.filter((w) => w.startsWith(word))
		.slice(0, numberOfWords);
	if (result.length === numberOfWords) {
		return result;
	}

	// 2. fuzzy search
	const fuzzy = fuzzysort
		.go(word, wordlist, { allowTypo: true })
		.map(({ target }) => target)
		.filter((w) => !result.includes(w));

	result = [...result, ...fuzzy].slice(0, numberOfWords);
	if (result.length === numberOfWords) {
		return result;
	}

	// 3. try to find similar words in case of typo
	const patience = patienceSort(word, wordlist).filter(
		(w) => !result.includes(w),
	);

	// reset cache if it is too big
	if (Object.keys(cache).length > 64000) {
		cache = {};
	}

	return [...result, ...patience].slice(0, numberOfWords);
}

function compareWords(a: string, b: string): number {
	if (a + b in cache) {
		return cache[a + b]!;
	}
	const res = patienceDiff(a.split(''), b.split(''));
	const diff = res.lineCountDeleted + res.lineCountInserted;
	cache[a + b] = diff;
	return diff;
}

function patienceSort(word: string, wordlist: Array<string>): Array<string> {
	// remove completely different words from the set
	const reducedWordlist = wordlist.filter(
		(w) => compareWords(word, w) / word.length < 0.55,
	);

	// sort the rest and return
	return reducedWordlist.sort((a, b) => {
		return compareWords(word, a) - compareWords(word, b);
	});
}
