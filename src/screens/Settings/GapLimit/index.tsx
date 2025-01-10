import React, { memo, ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import Button from '../../../components/buttons/Button';
import NavigationHeader from '../../../components/NavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { updateWallet } from '../../../store/slices/wallet';
import { gapLimitOptionsSelector } from '../../../store/reselect/wallet';
import { ScrollView, TextInput, View } from '../../../styles/components';
import { Caption13Up } from '../../../styles/text';
import { showToast } from '../../../utils/notifications';
import { getOnChainWalletAsync, refreshWallet } from '../../../utils/wallet';

const GapLimit = (): ReactElement => {
	const { t } = useTranslation('settings');
	const dispatch = useAppDispatch();
	const gapLimitOptions = useAppSelector(gapLimitOptionsSelector);
	const [loading, setLoading] = useState(false);
	const [lookBehind, setLookBehind] = useState<string>(
		String(gapLimitOptions.lookBehind),
	);
	const [lookAhead, setLookAhead] = useState<string>(
		String(gapLimitOptions.lookAhead),
	);
	const [lookBehindChange, setLookBehindChange] = useState<string>(
		String(gapLimitOptions.lookBehindChange),
	);
	const [lookAheadChange, setLookAheadChange] = useState<string>(
		String(gapLimitOptions.lookAheadChange),
	);

	const hasEdited = useMemo(() => {
		return (
			Number(lookBehind) !== gapLimitOptions.lookBehind ||
			Number(lookAhead) !== gapLimitOptions.lookAhead ||
			Number(lookBehindChange) !== gapLimitOptions.lookBehindChange ||
			Number(lookAheadChange) !== gapLimitOptions.lookAheadChange
		);
	}, [
		gapLimitOptions.lookAhead,
		gapLimitOptions.lookBehind,
		gapLimitOptions.lookAheadChange,
		gapLimitOptions.lookBehindChange,
		lookAhead,
		lookBehind,
		lookAheadChange,
		lookBehindChange,
	]);

	const areValid = useMemo(() => {
		return (
			Number(lookBehind) > 0 &&
			Number(lookAhead) > 0 &&
			Number(lookBehindChange) > 0 &&
			Number(lookAheadChange) > 0
		);
	}, [lookAhead, lookBehind, lookAheadChange, lookBehindChange]);

	const clearChanges = (): void => {
		setLookBehind(String(gapLimitOptions.lookBehind));
		setLookAhead(String(gapLimitOptions.lookAhead));
		setLookBehindChange(String(gapLimitOptions.lookBehindChange));
		setLookAheadChange(String(gapLimitOptions.lookAheadChange));
	};

	const saveGapLimit = async (): Promise<void> => {
		setLoading(true);
		const wallet = await getOnChainWalletAsync();
		const res = wallet.updateGapLimit({
			lookAhead: Number(lookAhead),
			lookBehind: Number(lookBehind),
			lookAheadChange: Number(lookAheadChange),
			lookBehindChange: Number(lookBehindChange),
		});
		if (res.isOk()) {
			dispatch(updateWallet({ gapLimitOptions: res.value }));
			await refreshWallet({
				lightning: false,
				onchain: true,
				scanAllAddresses: true,
			});
			showToast({
				type: 'success',
				title: t('gap.gap_limit_update_title'),
				description: t('gap.gap_limit_update_description'),
			});
		}
		setLoading(false);
	};

	return (
		<View style={styles.container}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('adv.gap_limit')} />
			<ScrollView contentContainerStyle={styles.content} bounces={false}>
				<Caption13Up color="secondary" style={styles.label}>
					{t('gap.look_behind')}
				</Caption13Up>
				<TextInput
					style={styles.textInput}
					value={lookBehind}
					placeholder="20"
					textAlignVertical="center"
					underlineColorAndroid="transparent"
					autoCapitalize="none"
					autoComplete="off"
					keyboardType="number-pad"
					autoCorrect={false}
					onChangeText={(txt): void => {
						setLookBehind(txt);
					}}
					returnKeyType="done"
					testID="LookBehind"
				/>

				<Caption13Up color="secondary" style={styles.label}>
					{t('gap.look_ahead')}
				</Caption13Up>
				<TextInput
					style={styles.textInput}
					value={lookAhead}
					placeholder="20"
					textAlignVertical="center"
					underlineColorAndroid="transparent"
					autoCapitalize="none"
					autoComplete="off"
					keyboardType="number-pad"
					autoCorrect={false}
					onChangeText={(txt): void => {
						setLookAhead(txt);
					}}
					testID="LookAhead"
				/>

				<Caption13Up color="secondary" style={styles.label}>
					{t('gap.look_behind_change')}
				</Caption13Up>
				<TextInput
					style={styles.textInput}
					value={lookBehindChange}
					placeholder="20"
					textAlignVertical="center"
					underlineColorAndroid="transparent"
					autoCapitalize="none"
					autoComplete="off"
					keyboardType="number-pad"
					autoCorrect={false}
					onChangeText={(txt): void => {
						setLookBehindChange(txt);
					}}
					returnKeyType="done"
					testID="LookBehindChange"
				/>

				<Caption13Up color="secondary" style={styles.label}>
					{t('gap.look_ahead_change')}
				</Caption13Up>
				<TextInput
					style={styles.textInput}
					value={lookAheadChange}
					placeholder="20"
					textAlignVertical="center"
					underlineColorAndroid="transparent"
					autoCapitalize="none"
					autoComplete="off"
					keyboardType="number-pad"
					autoCorrect={false}
					onChangeText={(txt): void => {
						setLookAheadChange(txt);
					}}
					testID="LookAheadChange"
				/>

				<View style={styles.buttons}>
					<Button
						style={styles.button}
						text={t('gap.reset')}
						variant="secondary"
						size="large"
						testID="ResetGapLimit"
						onPress={clearChanges}
						disabled={!hasEdited}
					/>
					<Button
						style={styles.button}
						text={t('gap.save')}
						size="large"
						testID="SaveGapLimit"
						loading={loading}
						disabled={!hasEdited || !areValid}
						onPress={saveGapLimit}
					/>
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flexGrow: 1,
		paddingHorizontal: 16,
	},
	label: {
		marginTop: 16,
		marginBottom: 4,
	},
	textInput: {
		minHeight: 52,
		marginTop: 5,
	},
	buttons: {
		flexDirection: 'row',
		marginTop: 16,
		gap: 16,
	},
	button: {
		flex: 1,
	},
});

export default memo(GapLimit);
