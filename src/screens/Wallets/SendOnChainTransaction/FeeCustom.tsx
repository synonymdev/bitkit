import React, { ReactElement, memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Caption13Up } from '../../../styles/components';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import { useTransactionDetails } from '../../../hooks/transaction';
import FeeCustomToggle from './FeeCustomToggle';
import FeeNumberPad from './FeeNumberPad';

const FeeRate = ({ navigation }): ReactElement => {
	const { satsPerByte } = useTransactionDetails();

	let onDone: (() => void) | undefined = undefined;

	if (satsPerByte !== 0) {
		onDone = (): void => {
			navigation.navigate('ReviewAndSend');
		};
	}

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader
				title="Set Custom Fee"
				displayBackButton={satsPerByte !== 0}
			/>
			<View style={styles.content}>
				<Caption13Up color="gray1" style={styles.title}>
					SAT / VBYTE
				</Caption13Up>
				<FeeCustomToggle />
				<FeeNumberPad style={styles.numberPad} onDone={onDone} />
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
		paddingHorizontal: 16,
	},
	title: {
		marginBottom: 16,
	},
	numberPad: {
		marginTop: 'auto',
		maxHeight: 425,
	},
});

export default memo(FeeRate);
