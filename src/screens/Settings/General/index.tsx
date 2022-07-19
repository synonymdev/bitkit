import React, { memo, ReactElement, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Modal, StyleSheet, Text, Pressable, View } from 'react-native';
import Store from './../../../store/types';
import { IListData } from './../../../components/List';
import SettingsView from './../SettingsView';
import { updateSettings } from '../../../store/actions/settings';

const General = ({ navigation }): ReactElement => {
	const [modalVisible, setModalVisible] = useState(false);

	const showSuggestions = useSelector(
		(state: Store) => state.settings.showSuggestions,
	);

	const selectedCurrency = useSelector(
		(state: Store) => state.settings.selectedCurrency,
	);

	const selectedBitcoinUnit = useSelector(
		(state: Store) => state.settings.bitcoinUnit,
	);

	const unitsBitcoin = {
		satoshi: 'Satoshis',
		BTC: 'Bitcoin',
	};

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
						title: 'Default transaction speed',
						value: 'Normal',
						type: 'button',
						onPress: (): void => {},
						hide: false,
					},
					{
						title: 'Display suggestions',
						enabled: showSuggestions ? true : false,
						type: 'switch',
						onPress: async (): Promise<void> => {
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[showSuggestions, selectedBitcoinUnit],
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
					setModalVisible(!modalVisible);
				}}>
				<View style={styles.centeredView}>
					<View style={styles.modalView}>
						<Text style={styles.modalTitle}>Reset Suggestions?</Text>
						<Text style={styles.modalText}>
							Are you sure you want to reset the suggestions? They will reappear
							in case you have removed them from your Bitkit wallet overview.
						</Text>
						<Pressable
							style={[styles.button]}
							onPress={(): void => {
								console.log('TODO: clean suggestions store');
								setModalVisible(!modalVisible);
							}}>
							<Text style={styles.buttonText}>No, Cancel</Text>
							<Text style={styles.buttonText}>Yes, Reset</Text>
						</Pressable>
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
		padding: 16,
		alignItems: 'center',
		shadowColor: '#000',
		color: '#fff',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
	},
	modalTitle: {
		fontWeight: '600',
		fontSize: 17,
		lineHeight: 22,
		textAlign: 'center',
		letterSpacing: -0.41,
		textTransform: 'capitalize',
		color: '#FFFFFF',
		marginBottom: 5,
	},
	button: {
		display: 'flex',
		justifyContent: 'space-between',
		flexDirection: 'row',
	},
	buttonText: {
		fontWeight: '400',
		fontSize: 17,
		lineHeight: 22,
		textAlign: 'center',
		letterSpacing: -0.41,
		textTransform: 'capitalize',
		color: '#FF6600',
		width: 119,
	},
	modalText: {
		fontWeight: '500',
		fontSize: 13,
		lineHeight: 18,
		letterSpacing: -0.08,
		textAlign: 'center',
		color: '#fff',
		paddingLeft: 16,
		paddingRight: 16,
		marginBottom: 16,
	},
});

export default memo(General);
