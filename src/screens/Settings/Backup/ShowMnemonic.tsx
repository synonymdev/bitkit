import React, { memo, ReactElement, useMemo, useState, useEffect } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
	View as ThemedView,
	Text01S,
	Text01M,
	Text02S,
} from '../../../styles/components';
import NavigationHeader from '../../../components/NavigationHeader';
import Button from '../../../components/Button';
import BlurView from '../../../components/BlurView';
import { getMnemonicPhrase } from '../../../utils/wallet';
import { useBottomSheetBackPress } from '../../../hooks/bottomSheet';

const Word = ({
	number,
	word,
}: {
	number: number;
	word: string;
}): ReactElement => {
	return (
		<Text01M style={styles.word}>
			<Text01M color="white5">{number}.</Text01M>
			<Text01M> {word}</Text01M>
		</Text01M>
	);
};

const ShowMnemonic = ({ navigation }): ReactElement => {
	const [show, setShow] = useState(false);
	const [seed, setSeed] = useState<string[]>([]);
	const insets = useSafeAreaInsets();
	const nextButtonContainer = useMemo(
		() => ({
			...styles.nextButtonContainer,
			paddingBottom: insets.bottom + 10,
		}),
		[insets.bottom],
	);

	useBottomSheetBackPress('backupNavigation');

	useEffect(() => {
		getMnemonicPhrase().then((res) => {
			if (res.isErr()) {
				return Alert.alert(res.error.message);
			}
			setSeed(res.value.split(' '));
		});
	}, []);

	return (
		<ThemedView color="onSurface" style={styles.container}>
			<NavigationHeader
				title="Your recovery phrase"
				size="sm"
				displayBackButton={false}
			/>

			<Text01S color="gray1">
				Write down these {seed.length} words in the right order and store them
				in a safe place.
			</Text01S>

			<View style={styles.seedContainer}>
				<ThemedView color="gray324" style={styles.seed}>
					<View style={styles.col}>
						{seed.slice(0, seed.length / 2).map((w, i) => (
							<Word key={i} word={w} number={i + 1} />
						))}
					</View>
					<View style={styles.col}>
						{seed.slice(-seed.length / 2).map((w, i) => (
							<Word key={i} word={w} number={seed.length / 2 + i + 1} />
						))}
					</View>
				</ThemedView>
				{!show && (
					<BlurView style={styles.blur}>
						<Button
							size="lg"
							text="Tap To Reveal"
							color="black5"
							onPress={(): void => setShow(true)}
						/>
					</BlurView>
				)}
			</View>

			<Text02S color="gray1">
				<Text02S color="brand">We recommend</Text02S> writing your recovery
				phrase down on paper and storing copies in various locations.
				<Text02S color="brand"> Never share</Text02S> your recovery phrase.
			</Text02S>

			<View style={nextButtonContainer}>
				<Button
					size="lg"
					text="Next Step"
					disabled={!show}
					onPress={(): void => navigation.navigate('ConfirmMnemonic', { seed })}
				/>
			</View>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 32,
	},
	seedContainer: {
		marginVertical: 32,
		position: 'relative',
	},
	seed: {
		paddingTop: 32,
		paddingBottom: 24,
		paddingHorizontal: 16,
		flexDirection: 'row',
		borderRadius: 16,
	},
	col: {
		marginHorizontal: 16,
		flex: 1,
	},
	blur: {
		position: 'absolute',
		justifyContent: 'center',
		alignItems: 'center',
		top: 5,
		right: 5,
		left: 5,
		bottom: 5,
		borderRadius: 10,
	},
	nextButtonContainer: {
		width: '100%',
		minHeight: 100,
		flex: 1,
		justifyContent: 'flex-end',
	},
	word: {
		marginBottom: 8,
	},
});

export default memo(ShowMnemonic);
