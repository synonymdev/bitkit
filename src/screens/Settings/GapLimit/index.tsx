import React, { memo, ReactElement, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { View, TextInput, ScrollView } from '../../../styles/components';
import { BodyM, Caption13Up } from '../../../styles/text';
import { useAppSelector } from '../../../hooks/redux';
import { gapLimitOptionsSelector } from '../../../store/reselect/wallet';
import NavigationHeader from '../../../components/NavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/Button';
import type { SettingsScreenProps } from '../../../navigation/types';
import { getOnChainWallet, refreshWallet } from '../../../utils/wallet';
import { updateWallet } from '../../../store/actions/wallet';
import { showToast } from '../../../utils/notifications';

const GapLimit = ({}: SettingsScreenProps<'GapLimit'>): ReactElement => {
	const { t } = useTranslation('settings');
	const gapLimitOptions = useAppSelector(gapLimitOptionsSelector);
	const [loading, setLoading] = useState(false);
	const [lookBehind, setLookBehind] = useState<string>(
		String(gapLimitOptions.lookBehind),
	);
	const [lookAhead, setLookAhead] = useState<string>(
		String(gapLimitOptions.lookAhead),
	);

	const hasEdited = useMemo(() => {
		return (
			Number(lookBehind) !== gapLimitOptions.lookBehind ||
			Number(lookAhead) !== gapLimitOptions.lookAhead
		);
	}, [
		gapLimitOptions.lookAhead,
		gapLimitOptions.lookBehind,
		lookAhead,
		lookBehind,
	]);

	const areValid = useMemo(() => {
		return Number(lookBehind) > 0 && Number(lookAhead) > 0;
	}, [lookAhead, lookBehind]);

	const clearChanges = (): void => {
		setLookBehind(String(gapLimitOptions.lookBehind));
		setLookAhead(String(gapLimitOptions.lookAhead));
	};

	const saveGapLimit = async (): Promise<void> => {
		setLoading(true);
		const wallet = getOnChainWallet();
		const res = wallet.updateGapLimit({
			lookAhead: Number(lookAhead),
			lookBehind: Number(lookBehind),
		});
		if (res.isOk()) {
			updateWallet({
				gapLimitOptions: res.value,
			});
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
				<BodyM color="secondary">Look Behind</BodyM>
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
					{'Look Ahead'}
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
