import React, { memo, ReactElement, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Modal, StyleSheet, Text, Pressable, View } from 'react-native';
import Store from '../../../store/types';
import { IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { removePin, toggleBiometrics } from '../../../utils/settings';
import { IsSensorAvailableResult } from '../../../components/Biometrics';
import { toggleView } from '../../../store/actions/user';
import { updateSettings } from '../../../store/actions/settings';

const SecuritySettings = ({ navigation }): ReactElement => {
	const [modalVisible, setModalVisible] = useState(false);
	const [biometryData] = useState<IsSensorAvailableResult | undefined>(
		undefined,
	);
	const { pin, biometrics, pinOnLaunch, pinForPayments } = useSelector(
		(state: Store) => state.settings,
	);

	const SettingsListData: IListData[] = useMemo(
		() => [
			{
				data: [
					{
						title: 'Swipe balance to hide',
						value: true ? 'Enabled' : 'Disabled', // TODO
						type: 'switch',
						onPress: (): void => {},
						hide: false,
					},
					{
						title: 'Pin',
						value: pin ? 'Enabled' : 'Disabled',
						type: 'button',
						onPress: (): void => {
							if (pin) {
								navigation.navigate('AuthCheck', {
									onSuccess: () => {
										navigation.pop();
										removePin().then();
									},
								});
							} else {
								toggleView({
									view: 'PINPrompt',
									data: { isOpen: true },
								});
							}
						},
						hide: false,
					},
					{
						title: 'Require PIN on launch',
						type: 'switch',
						enabled: pinOnLaunch,
						onPress: (): void => {
							navigation.navigate('AuthCheck', {
								onSuccess: () => {
									navigation.pop();
									updateSettings({ pinOnLaunch: !pinOnLaunch });
								},
							});
						},
						hide: !pin,
					},
					{
						title: 'Require PIN for payments',
						type: 'switch',
						enabled: pinForPayments,
						onPress: (): void => {
							navigation.navigate('AuthCheck', {
								onSuccess: () => {
									navigation.pop();
									updateSettings({ pinForPayments: !pinForPayments });
								},
							});
						},
						hide: !pin,
					},
					{
						title: 'Use Biometrics instead',
						type: 'switch',
						enabled: biometrics,
						onPress: (): void => {
							navigation.navigate('AuthCheck', {
								onSuccess: () => {
									navigation.pop();
									toggleBiometrics();
								},
							});
						},
						hide:
							!pin || (!biometryData?.available && !biometryData?.biometryType),
					},
				],
			},
		],
		[
			biometryData?.available,
			biometryData?.biometryType,
			biometrics,
			pin,
			pinOnLaunch,
			pinForPayments,
			navigation,
		],
	);

	return (
		<>
			<SettingsView
				title={'Security and Privacy'}
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

export default memo(SecuritySettings);
