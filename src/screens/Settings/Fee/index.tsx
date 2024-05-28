import React, { ReactElement, memo, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import SettingsView from '../SettingsView';
import { SettingsScreenProps } from '../../../navigation/types';
import { Caption13Up, BodyM } from '../../../styles/text';
import { ScrollView, View as ThemedView } from '../../../styles/components';
import { i18nTime } from '../../../utils/i18n';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import {
	onChainFeesSelector,
	overrideFeeSelector,
} from '../../../store/reselect/fees';
import {
	updateOnchainFees,
	updateOverrideFees,
} from '../../../store/slices/fees';
import { refreshOnchainFeeEstimates } from '../../../store/utils/fees';
import { EItemType, IListData } from '../../../components/List';
import Button from '../../../components/Button';
import SafeAreaInset from '../../../components/SafeAreaInset';
import { capitalize } from '../../../utils/helpers';
import { refreshLdk } from '../../../utils/lightning';

const order = ['minimum', 'slow', 'normal', 'fast'];

const FeeInput = ({
	title,
	value,
	override,
	onPlus,
	onMinus,
}: {
	title: string;
	value: ReactElement;
	override: boolean;
	onPlus: (title: string) => void;
	onMinus: (title: string) => void;
}): ReactElement => {
	return (
		<View style={styles.item}>
			<View style={styles.leftColumn}>
				<View>
					<BodyM color="white">{capitalize(title)}</BodyM>
				</View>
			</View>
			{override && (
				<View style={styles.centerColumn}>
					<Button
						style={styles.button}
						text="-"
						size="small"
						onPress={(): void => {
							onMinus(title);
						}}
					/>
					<Button
						style={styles.button}
						text="+"
						size="small"
						onPress={(): void => {
							onPlus(title);
						}}
					/>
				</View>
			)}
			<View style={styles.rightColumn}>
				<BodyM color="secondary">{value}</BodyM>
			</View>
		</View>
	);
};

const FeeSettings = ({}: SettingsScreenProps<'FeeSettings'>): ReactElement => {
	const { t: tTime } = useTranslation('intl', { i18n: i18nTime });
	const dispatch = useAppDispatch();
	const fees = useAppSelector(onChainFeesSelector);
	const override = useAppSelector(overrideFeeSelector);
	const [loading, setLoading] = useState(false);

	const handleMinus = (title: string): void => {
		const newFees = { ...fees, timestamp: Date.now() };
		const value = fees[title] > 2 ? fees[title] - 1 : 1;
		for (const key of order) {
			if (order.indexOf(key) > order.indexOf(title)) {
				continue;
			}

			if (newFees[key] > value) {
				newFees[key] = value;
			}
		}
		dispatch(updateOnchainFees(newFees));
	};

	const handlePlus = (title: string): void => {
		const newFees = { ...fees, timestamp: Date.now() };
		const value = fees[title] + 1;
		for (const key of order) {
			if (order.indexOf(key) < order.indexOf(title)) {
				continue;
			}

			if (newFees[key] < value) {
				newFees[key] = value;
			}
		}
		dispatch(updateOnchainFees(newFees));
	};

	const handleRefreshLDK = async (): Promise<void> => {
		setLoading(true);
		await refreshLdk();
		setLoading(false);
	};

	const settingsListData: IListData[] = useMemo(() => {
		const updated = tTime('dateTime', {
			v: new Date(fees.timestamp),
			formatParams: {
				v: {
					month: 'short',
					day: 'numeric',
					hour: 'numeric',
					minute: 'numeric',
					second: 'numeric',
					hour12: false,
				},
			},
		});

		return [
			{
				data: [
					{
						title: 'Update',
						value: updated,
						type: EItemType.textButton,
						onPress: (): void => {
							refreshOnchainFeeEstimates({ forceUpdate: true });
						},
					},
					{
						title: 'Override',
						enabled: !!override,
						type: EItemType.switch,
						onPress: (): void => {
							dispatch(updateOverrideFees(!override));
						},
					},
				],
			},
		];
	}, [override, fees, tTime, dispatch]);

	return (
		<ThemedView style={styles.container}>
			<SettingsView
				title="Override Fees"
				listData={settingsListData}
				fullHeight={false}
			/>
			<ScrollView
				style={styles.override}
				contentContainerStyle={styles.override}>
				<Caption13Up style={styles.caption} color="secondary">
					Values
				</Caption13Up>
				{order.map((o) => (
					<FeeInput
						key={o}
						title={o}
						value={fees[o]}
						override={override}
						onMinus={handleMinus}
						onPlus={handlePlus}
					/>
				))}
				<View style={styles.refresh}>
					<Button
						text="Refresh LDK to apply new fees"
						size="large"
						onPress={handleRefreshLDK}
						loading={loading}
					/>
				</View>
				<SafeAreaInset type="bottom" />
			</ScrollView>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	caption: {
		marginLeft: 16,
		marginBottom: 12,
	},
	override: {
		flexGrow: 1,
	},
	item: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
		minHeight: 55,
		marginHorizontal: 16,
	},
	leftColumn: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	centerColumn: {
		alignItems: 'center',
		flexDirection: 'row',
	},
	rightColumn: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'flex-end',
		minWidth: 32,
	},
	button: {
		minWidth: 64,
		marginHorizontal: 8,
	},
	refresh: {
		flex: 1,
		marginHorizontal: 16,
		justifyContent: 'flex-end',
	},
});

export default memo(FeeSettings);
