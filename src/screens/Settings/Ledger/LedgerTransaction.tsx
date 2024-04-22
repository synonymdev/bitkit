import Clipboard from '@react-native-clipboard/clipboard';
import React, { ReactElement, memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import NavigationHeader from '../../../components/NavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import { SettingsScreenProps } from '../../../navigation/types';
import { ScrollView, View as ThemedView } from '../../../styles/components';
import { Caption13M, Caption13Up } from '../../../styles/text';
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
					<Caption13M>{name}</Caption13M>
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
						<Caption13Up color="gray1">Details</Caption13Up>
					</View>
					<Section
						name="id"
						value={
							<Caption13M ellipsizeMode="middle" numberOfLines={1}>
								{id}
							</Caption13M>
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
							<Caption13M>
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
							</Caption13M>
						}
					/>
					<Section name="Amount" value={<Caption13M>{amount}</Caption13M>} />
					<Section
						name="From"
						value={
							<Caption13M>
								{fromAcc.wallet} / {fromAcc.account}
							</Caption13M>
						}
					/>
					<Section
						name="To"
						value={
							<Caption13M>
								{toAcc.wallet} / {toAcc.account}
							</Caption13M>
						}
					/>
				</View>

				<View style={styles.section}>
					<View style={styles.row}>
						<View style={styles.column}>
							<View style={styles.sectionTitle}>
								<Caption13Up color="gray1">Balance before From</Caption13Up>
							</View>
							<Section
								name="Available"
								value={
									<Caption13M ellipsizeMode="middle" numberOfLines={1}>
										{balancesBefore.fromWallet.available}
									</Caption13M>
								}
							/>
							<Section
								name="Hodl"
								value={
									<Caption13M ellipsizeMode="middle" numberOfLines={1}>
										{balancesBefore.fromWallet.hold}
									</Caption13M>
								}
							/>
						</View>
						<View style={styles.column}>
							<View style={styles.sectionTitle}>
								<Caption13Up color="gray1">Balance before To</Caption13Up>
							</View>
							<Section
								name="Available"
								value={
									<Caption13M ellipsizeMode="middle" numberOfLines={1}>
										{balancesBefore.toWallet.available}
									</Caption13M>
								}
							/>
							<Section
								name="Hodl"
								value={
									<Caption13M ellipsizeMode="middle" numberOfLines={1}>
										{balancesBefore.toWallet.hold}
									</Caption13M>
								}
							/>
						</View>
					</View>
				</View>

				<View style={styles.section}>
					<View style={styles.sectionTitle}>
						<Caption13Up color="gray1">Metadata</Caption13Up>
					</View>

					<Caption13M>{`${meta}`}</Caption13M>
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
