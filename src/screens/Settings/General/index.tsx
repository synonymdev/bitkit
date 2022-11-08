import React, { memo, ReactElement, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import Store from './../../../store/types';
import { IListData } from '../../../components/List';
import SettingsView from './../SettingsView';
import { updateSettings } from '../../../store/actions/settings';
import { resetTodos } from '../../../store/actions/todos';
import Dialog from '../../../components/Dialog';
import type { SettingsScreenProps } from '../../../navigation/types';

const typesDescriptions = {
	p2wpkh: 'Bech32',
	p2sh: 'Segwit',
	p2pkh: 'Legacy',
};

const unitsBitcoin = {
	satoshi: 'Satoshis',
	BTC: 'Bitcoin',
};

const transactionSpeeds = {
	slow: 'Slow',
	normal: 'Normal',
	fast: 'Fast',
	custom: 'Custom',
};

const GeneralSettings = ({
	navigation,
}: SettingsScreenProps<'GeneralSettings'>): ReactElement => {
	const [showDialog, setShowDialog] = useState(false);

	const showSuggestions = useSelector(
		(state: Store) => state.settings.showSuggestions,
	);

	const selectedWallet = useSelector(
		(state: Store) => state.wallet.selectedWallet,
	);

	const selectedNetwork = useSelector(
		(state: Store) => state.wallet.selectedNetwork,
	);

	const selectedTransactionSpeed = useSelector(
		(state: Store) => state.settings.transactionSpeed,
	);

	const selectedCurrency = useSelector(
		(state: Store) => state.settings.selectedCurrency,
	);

	const selectedBitcoinUnit = useSelector(
		(state: Store) => state.settings.bitcoinUnit,
	);

	const selectedAddressType = useSelector(
		(state: Store) =>
			state.wallet.wallets[selectedWallet].addressType[selectedNetwork],
	);

	const SettingsListData: IListData[] = useMemo(
		() => [
			{
				data: [
					{
						title: 'Local currency',
						value: selectedCurrency,
						type: 'button',
						onPress: (): void => navigation.navigate('CurrenciesSettings'),
					},
					{
						title: 'Bitcoin unit',
						value: unitsBitcoin[selectedBitcoinUnit],
						type: 'button',
						onPress: (): void => navigation.navigate('BitcoinUnitSettings'),
					},
					{
						title: 'Bitcoin address type',
						type: 'button',
						value: typesDescriptions[selectedAddressType],
						onPress: (): void => navigation.navigate('AddressTypePreference'),
					},
					{
						title: 'Default transaction speed',
						value: transactionSpeeds[selectedTransactionSpeed],
						type: 'button',
						onPress: (): void =>
							navigation.navigate('TransactionSpeedSettings'),
					},
					{
						title: 'Blocktank Orders',
						type: 'button',
						onPress: (): void => navigation.navigate('BlocktankOrders'),
					},
					{
						title: 'Display suggestions',
						enabled: showSuggestions,
						type: 'switch',
						onPress: (): void => {
							updateSettings({ showSuggestions: !showSuggestions });
						},
					},
					{
						title: 'Reset suggestions',
						type: 'button',
						onPress: (): void => {
							setShowDialog(true);
						},
					},
				],
			},
		],
		[
			selectedCurrency,
			selectedBitcoinUnit,
			selectedAddressType,
			selectedTransactionSpeed,
			showSuggestions,
			navigation,
		],
	);

	return (
		<>
			<SettingsView
				title="General"
				listData={SettingsListData}
				showBackNavigation={true}
			/>
			<Dialog
				visible={showDialog}
				title="Reset Suggestions?"
				description="Are you sure you want to reset the suggestions? They will
				reappear in case you have removed them from your Bitkit wallet
				overview."
				onCancel={(): void => {
					setShowDialog(false);
				}}
				onConfirm={(): void => {
					resetTodos();
					setShowDialog(false);
				}}
			/>
		</>
	);
};

export default memo(GeneralSettings);
