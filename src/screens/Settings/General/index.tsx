import React, { memo, ReactElement, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Modal, StyleSheet, Text, Pressable, View } from 'react-native';

import Store from './../../../store/types';
import { IListData } from '../../../components/List';
import SettingsView from './../SettingsView';
import { updateSettings } from '../../../store/actions/settings';
import { setupTodos } from '../../../utils/todos';
import { resetTodo } from '../../../store/actions/todos';
import colors from '../../../styles/colors';
import { getSelectedAddressType } from '../../../utils/wallet';

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

const General = ({ navigation }): ReactElement => {
	const [modalVisible, setModalVisible] = useState(false);

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

	const selectedAddressType = useMemo(
		(): string =>
			getSelectedAddressType({
				selectedWallet,
				selectedNetwork,
			}),
		[selectedNetwork, selectedWallet],
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
						hide: false,
					},
					{
						title: 'Bitcoin unit',
						value: unitsBitcoin[selectedBitcoinUnit],
						type: 'button',
						onPress: (): void => navigation.navigate('BitcoinUnitSettings'),
						hide: false,
					},
					{
						title: 'Bitcoin address type',
						type: 'button',
						value: typesDescriptions[selectedAddressType],
						onPress: (): void => navigation.navigate('AddressTypePreference'),
						hide: false,
					},
					{
						title: 'Default transaction speed',
						value: transactionSpeeds[selectedTransactionSpeed],
						type: 'button',
						onPress: (): void =>
							navigation.navigate('TransactionSpeedSettings'),
						hide: false,
					},
					{
						title: 'Blocktank Orders',
						type: 'button',
						onPress: (): void => navigation.navigate('BlocktankOrders'),
						hide: false,
					},
					{
						title: 'Display suggestions',
						enabled: showSuggestions,
						type: 'switch',
						onPress: (): void => {
							updateSettings({ showSuggestions: !showSuggestions });
						},
						hide: false,
					},
					{
						title: 'Reset suggestions',
						type: 'button',
						onPress: (): void => {
							setModalVisible(true);
						},
						hide: false,
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
				title={'General'}
				listData={SettingsListData}
				showBackNavigation={true}
			/>
			<Modal
				animationType="slide"
				transparent={true}
				visible={modalVisible}
				onRequestClose={(): void => {
					setModalVisible(false);
				}}>
				<View style={styles.centeredView}>
					<View style={styles.modalView}>
						<View style={styles.modalText}>
							<Text style={styles.modalTitle}>Reset Suggestions?</Text>
							<Text style={styles.modalDescription}>
								Are you sure you want to reset the suggestions? They will
								reappear in case you have removed them from your Bitkit wallet
								overview.
							</Text>
						</View>
						<View style={styles.buttons}>
							<Pressable
								style={[styles.button, styles.buttonLeft]}
								onPress={(): void => {
									setModalVisible(false);
								}}>
								<Text style={styles.buttonText}>No, Cancel</Text>
							</Pressable>
							<Pressable
								style={styles.button}
								onPress={(): void => {
									resetTodo();
									// add timeout to avoid a bug
									setTimeout(() => setupTodos(), 2000);
									setModalVisible(false);
								}}>
								<Text style={styles.buttonText}>Yes, Reset</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>
		</>
	);
};

const styles = StyleSheet.create({
	centeredView: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 22,
	},
	modalView: {
		margin: 20,
		width: 270,
		backgroundColor: 'rgba(49, 49, 49, 1)',
		backdropFilter: 'blur(27.1828px)',
		borderRadius: 14,
		alignItems: 'center',
		shadowColor: colors.black,
		color: colors.white,
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
	},
	modalText: {
		padding: 16,
	},
	modalTitle: {
		fontWeight: '600',
		fontSize: 17,
		lineHeight: 22,
		textAlign: 'center',
		letterSpacing: -0.41,
		textTransform: 'capitalize',
		color: colors.white,
		marginBottom: 5,
	},
	modalDescription: {
		fontWeight: '500',
		fontSize: 13,
		lineHeight: 18,
		letterSpacing: -0.08,
		textAlign: 'center',
		color: colors.white,
	},
	buttons: {
		flexDirection: 'row',
	},
	button: {
		borderTopWidth: 1,
		borderColor: colors.gray3,
		padding: 16,
		flex: 1,
	},
	buttonLeft: {
		borderRightWidth: 1,
		borderColor: colors.gray3,
	},
	buttonText: {
		fontWeight: '400',
		fontSize: 17,
		lineHeight: 22,
		textAlign: 'center',
		letterSpacing: -0.41,
		textTransform: 'capitalize',
		color: colors.brand,
	},
});

export default memo(General);
