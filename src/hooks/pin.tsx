import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { PIN_ATTEMPTS } from '../constants/app';
import { wipeApp } from '../store/utils/settings';
import { vibrate } from '../utils/helpers';
import { getKeychainValue, setKeychainValue } from '../utils/keychain';
import { showToast } from '../utils/notifications';
import useColors from './colors';

export type UsePIN =
	| {
			attemptsRemaining: undefined;
			Dots: undefined;
			handleNumberPress: undefined;
			isLastAttempt: undefined;
			loading: true;
			pin: undefined;
	  }
	| {
			attemptsRemaining: number;
			Dots: () => JSX.Element;
			handleNumberPress: (key: string) => void;
			isLastAttempt: boolean;
			loading: false;
			pin: string;
	  };

const PIN_LENGTH = 4;

const usePIN = (onSuccess?: () => void): UsePIN => {
	const { brand, brand08 } = useColors();
	const { t } = useTranslation('security');
	const [pin, setPin] = useState('');
	const [loading, setLoading] = useState(true);
	const [attemptsRemaining, setAttemptsRemaining] = useState(0);

	const isLastAttempt = attemptsRemaining === 1;

	const handleNumberPress = useCallback((key: string): void => {
		vibrate();
		if (key === 'delete') {
			setPin((p) => {
				return p.length === 0 ? '' : p.slice(0, -1);
			});
		} else {
			setPin((p) => {
				return p.length === 4 ? p : p + key;
			});
		}
	}, []);

	// Reduce the amount of pin attempts remaining.
	const reducePinAttemptsRemaining = useCallback(async (): Promise<void> => {
		const _attemptsRemaining = attemptsRemaining - 1;
		await setKeychainValue({
			key: 'pinAttemptsRemaining',
			value: `${_attemptsRemaining}`,
		});
		setAttemptsRemaining(_attemptsRemaining);
	}, [attemptsRemaining]);

	// on mount
	useEffect(() => {
		(async (): Promise<void> => {
			setLoading(true);
			// wait for initial keychain read
			const attemptsRemainingResponse = await getKeychainValue({
				key: 'pinAttemptsRemaining',
			});
			setAttemptsRemaining(Number(attemptsRemainingResponse.data));
			// get available biometrics
			setLoading(false);
		})();
	}, []);

	// submit pin
	useEffect(() => {
		const timer = setTimeout(async () => {
			if (pin.length !== PIN_LENGTH) {
				return;
			}

			const realPIN = await getKeychainValue({ key: 'pin' });

			// error getting pin
			if (realPIN.error) {
				await reducePinAttemptsRemaining();
				vibrate();
				setPin('');
				return;
			}

			// incorrect pin
			if (pin !== realPIN?.data) {
				if (attemptsRemaining <= 1) {
					vibrate({ type: 'default' });
					await wipeApp();
					showToast({
						type: 'warning',
						title: t('wiped_title'),
						description: t('wiped_message'),
					});
				} else {
					await reducePinAttemptsRemaining();
				}

				vibrate();
				setPin('');
				return;
			}

			// correct pin
			await setKeychainValue({
				key: 'pinAttemptsRemaining',
				value: PIN_ATTEMPTS,
			});
			setPin('');
			onSuccess?.();
		}, 500);

		return (): void => clearTimeout(timer);
	}, [attemptsRemaining, onSuccess, pin, reducePinAttemptsRemaining, t]);

	const Dots = useCallback(
		() => (
			<View style={styles.dots}>
				{Array(PIN_LENGTH)
					.fill(null)
					.map((_, i) => (
						<View
							key={i}
							style={[
								styles.dot,
								{
									borderColor: brand,
									backgroundColor: pin[i] === undefined ? brand08 : brand,
								},
							]}
						/>
					))}
			</View>
		),
		[pin, brand, brand08],
	);

	// we don't want to show anything while loading
	if (loading) {
		return {
			attemptsRemaining: undefined,
			Dots: undefined,
			handleNumberPress: undefined,
			isLastAttempt: undefined,
			loading,
			pin: undefined,
		};
	}

	return {
		attemptsRemaining,
		Dots,
		handleNumberPress,
		isLastAttempt,
		loading,
		pin,
	};
};

const styles = StyleSheet.create({
	dots: {
		flexDirection: 'row',
		justifyContent: 'center',
	},
	dot: {
		width: 20,
		height: 20,
		borderRadius: 10,
		marginHorizontal: 12,
		borderWidth: 1,
	},
});

export default usePIN;
