import Clipboard from '@react-native-clipboard/clipboard';
import React, { ReactElement, memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import NavigationHeader from '../../../components/NavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import { SettingsScreenProps } from '../../../navigation/types';
import { ScrollView, View as ThemedView } from '../../../styles/components';
import { CaptionB, Caption13Up } from '../../../styles/text';
import { i18nTime } from '../../../utils/i18n';
import { bitkitLedger } from '../../../utils/ledger';
import { showToast } from '../../../utils/notifications';
import { accToEmoji } from '.';

const Section = memo(
	({
		name,
		value,
		testID,
		onPress,
	}: {
		name: string;
		value: ReactElement;
		testID?: string;
		onPress?: () => void;
	}): ReactElement => {
		return (
			<TouchableOpacity
				activeOpacity={onPress ? 0.5 : 1}
				onPress={onPress}
				style={styles.sectionRoot}>
				<View style={styles.sectionName}>
					<CaptionB>{name}</CaptionB>
				</View>
				<View style={styles.sectionValue} testID={testID}>
					{value}
				</View>
			</TouchableOpacity>
		);
	},
);

const LedgerTransaction = ({
	navigation,
	route,
}: SettingsScreenProps<'LedgerTransaction'>): ReactElement => {
	const { ledgerTxId } = route.params;
	const { t } = useTranslation();
	const { t: tTime } = useTranslation('intl', { i18n: i18nTime });

	const tx = useMemo(
		() => bitkitLedger?.ledger.getTransaction(ledgerTxId)!,
		[ledgerTxId],
	);
	const { id, balancesBefore, amount, fromAcc, toAcc, metadata, timestamp } =
		tx;
	const meta = JSON.stringify(metadata, null, 2);
	const fromText = accToEmoji(fromAcc);
	const toText = accToEmoji(toAcc);

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={`${fromText} ⟶ ${toText}`}
				onClosePress={(): void => navigation.goBack()}
			/>
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.section}>
					<View style={styles.sectionTitle}>
						<Caption13Up color="white50">Details</Caption13Up>
					</View>
					<Section
						name="id"
						value={
							<CaptionB ellipsizeMode="middle" numberOfLines={1}>
								{id}
							</CaptionB>
						}
						onPress={(): void => {
							Clipboard.setString(String(id));
							showToast({
								type: 'success',
								title: t('copied'),
								description: String(id),
							});
						}}
					/>
					<Section
						name="Time recorded"
						value={
							<CaptionB>
								{tTime('dateTime', {
									v: new Date(timestamp),
									formatParams: {
										v: {
											year: 'numeric',
											month: 'short',
											day: 'numeric',
											hour: 'numeric',
											minute: 'numeric',
											hour12: false,
										},
									},
								})}
							</CaptionB>
						}
					/>
					<Section name="Amount" value={<CaptionB>{amount}</CaptionB>} />
					<Section
						name="From"
						value={
							<CaptionB>
								{fromAcc.wallet} / {fromAcc.account}
							</CaptionB>
						}
					/>
					<Section
						name="To"
						value={
							<CaptionB>
								{toAcc.wallet} / {toAcc.account}
							</CaptionB>
						}
					/>
				</View>

				<View style={styles.section}>
					<View style={styles.row}>
						<View style={styles.column}>
							<View style={styles.sectionTitle}>
								<Caption13Up color="white50">Balance before From</Caption13Up>
							</View>
							<Section
								name="Available"
								value={
									<CaptionB ellipsizeMode="middle" numberOfLines={1}>
										{balancesBefore.fromWallet.available}
									</CaptionB>
								}
							/>
							<Section
								name="Hodl"
								value={
									<CaptionB ellipsizeMode="middle" numberOfLines={1}>
										{balancesBefore.fromWallet.hold}
									</CaptionB>
								}
							/>
						</View>
						<View style={styles.column}>
							<View style={styles.sectionTitle}>
								<Caption13Up color="white50">Balance before To</Caption13Up>
							</View>
							<Section
								name="Available"
								value={
									<CaptionB ellipsizeMode="middle" numberOfLines={1}>
										{balancesBefore.toWallet.available}
									</CaptionB>
								}
							/>
							<Section
								name="Hodl"
								value={
									<CaptionB ellipsizeMode="middle" numberOfLines={1}>
										{balancesBefore.toWallet.hold}
									</CaptionB>
								}
							/>
						</View>
					</View>
				</View>

				<View style={styles.section}>
					<View style={styles.sectionTitle}>
						<Caption13Up color="white50">Metadata</Caption13Up>
					</View>

					<CaptionB>{`${meta}`}</CaptionB>
				</View>

				<SafeAreaInset type="bottom" />
			</ScrollView>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		justifyContent: 'space-between',
	},
	content: {
		paddingHorizontal: 16,
		flexGrow: 1,
	},
	section: {
		marginTop: 16,
	},
	sectionTitle: {
		marginBottom: 8,
		flexDirection: 'row',
		alignItems: 'center',
	},
	sectionRoot: {
		height: 50,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
	},
	sectionName: {
		flex: 1,
	},
	sectionValue: {
		flex: 1.5,
		alignItems: 'flex-end',
		justifyContent: 'center',
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	column: {
		width: '45%',
	},
});

export default memo(LedgerTransaction);
