import React, { memo, ReactElement, useMemo } from 'react';
import { View, StyleSheet, GestureResponderEvent } from 'react-native';
import { useSelector } from 'react-redux';

import { TouchableOpacity, SwitchIcon } from '../../styles/components';
import Store from '../../store/types';
import { Text02B } from '../../styles/components';
import { updateSettings } from '../../store/actions/settings';
import useDisplayValues from '../../hooks/displayValues';
import { IColors } from '../../styles/colors';

type NumberPadButtons = {
	color?: keyof IColors;
	showUnitButton?: boolean;
	onMaxPress?: (event: GestureResponderEvent) => void;
	onDone?: (event: GestureResponderEvent) => void;
};

const NumberPadButtons = ({
	color = 'brand',
	showUnitButton = true,
	onMaxPress,
	onDone,
}: NumberPadButtons): ReactElement => {
	const selectedWallet = useSelector(
		(store: Store) => store.wallet.selectedWallet,
	);
	const selectedNetwork = useSelector(
		(store: Store) => store.wallet.selectedNetwork,
	);

	const balance = useSelector(
		(store: Store) =>
			store.wallet.wallets[selectedWallet]?.balance[selectedNetwork],
	);

	const displayValues = useDisplayValues(balance);
	const bitcoinUnit = useSelector((state: Store) => state.settings.bitcoinUnit);
	const unitPreference = useSelector(
		(state: Store) => state.settings.unitPreference,
	);

	const isMaxSendAmount = useSelector(
		(state: Store) =>
			state.wallet.wallets[selectedWallet]?.transaction[selectedNetwork]?.max ??
			false,
	);

	// BTC -> satoshi -> fiat
	const nextUnit = useMemo(() => {
		if (unitPreference === 'asset') {
			return bitcoinUnit === 'BTC' ? 'satoshi' : 'fiat';
		}
		return 'BTC';
	}, [bitcoinUnit, unitPreference]);

	const onChangeUnit = (): void => {
		updateSettings({
			unitPreference: nextUnit === 'fiat' ? 'fiat' : 'asset',
			...(nextUnit !== 'fiat' && { bitcoinUnit: nextUnit }),
		});
	};

	return (
		<View style={styles.container}>
			<View style={styles.buttonContainer}>
				{onMaxPress && (
					<TouchableOpacity
						style={styles.button}
						color="white08"
						disabled={balance <= 0}
						onPress={onMaxPress}>
						<Text02B size="12px" color={isMaxSendAmount ? 'orange' : color}>
							MAX
						</Text02B>
					</TouchableOpacity>
				)}
			</View>

			<View style={styles.buttonContainer}>
				{showUnitButton && (
					<TouchableOpacity
						style={styles.button}
						color="white08"
						onPress={onChangeUnit}>
						<SwitchIcon color={color} width={16.44} height={13.22} />
						<Text02B size="12px" color={color} style={styles.middleButtonText}>
							{nextUnit === 'BTC' && 'BTC'}
							{nextUnit === 'satoshi' && 'sats'}
							{nextUnit === 'fiat' && displayValues.fiatTicker}
						</Text02B>
					</TouchableOpacity>
				)}
			</View>

			<View style={styles.buttonContainer}>
				{onDone && (
					<TouchableOpacity
						style={styles.button}
						color="white08"
						onPress={onDone}>
						<Text02B size="12px" color={color}>
							DONE
						</Text02B>
					</TouchableOpacity>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		paddingVertical: 10,
		paddingTop: 15,
		justifyContent: 'space-evenly',
	},
	buttonContainer: {
		flex: 1,
		alignItems: 'center',
		minHeight: 28,
	},
	button: {
		paddingVertical: 7,
		paddingHorizontal: 8,
		borderRadius: 8,
		flexDirection: 'row',
		alignItems: 'center',
	},
	middleButtonText: {
		marginLeft: 11,
	},
});

export default memo(NumberPadButtons);
