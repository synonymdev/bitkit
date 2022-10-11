import React, { ReactElement, memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';

import Biometrics from '../../../components/Biometrics';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import { SendScreenProps } from '../../../navigation/types';
import Store from '../../../store/types';
import { Text01S } from '../../../styles/components';
import PinPad from './SendPinPad';

const SendAuthCheck = ({
	route,
}: SendScreenProps<'AuthCheck'>): ReactElement => {
	const { onSuccess } = route.params;
	const pin = useSelector((state: Store) => state.settings.pin);
	const biometrics = useSelector((state: Store) => state.settings.biometrics);

	const [displayPin, setDisplayPin] = useState(pin);
	const [displayBiometrics, setDisplayBiometrics] = useState(biometrics);

	const askForPin = displayPin && !displayBiometrics;
	const askForBiometrics = displayPin && displayBiometrics;
	const title = askForPin ? 'Enter PIN Code' : 'Confirm with Biometrics';

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title={title} />
			<View style={styles.content}>
				<View style={styles.text}>
					<Text01S color="white5">
						Please enter your PIN code to confirm and send out this payment.
					</Text01S>
				</View>

				{askForPin && (
					<PinPad
						onSuccess={(): void => {
							setDisplayPin(false);
							onSuccess?.();
						}}
					/>
				)}

				{askForBiometrics && (
					<Biometrics
						onSuccess={(): void => {
							setDisplayBiometrics(false);
							setDisplayPin(false);
							onSuccess?.();
						}}
						onFailure={(): void => {
							setDisplayBiometrics(false);
						}}
					/>
				)}
			</View>
		</GradientView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
	},
	text: {
		paddingHorizontal: 32,
	},
});

export default memo(SendAuthCheck);
