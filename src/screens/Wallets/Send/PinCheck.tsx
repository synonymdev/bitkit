import React, { ReactElement, memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import { Text01S } from '../../../styles/text';
import PinPad from './SendPinPad';
import type { SendScreenProps } from '../../../navigation/types';

const PinCheck = ({ route }: SendScreenProps<'PinCheck'>): ReactElement => {
	const { onSuccess } = route.params;
	const { t } = useTranslation('security');

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title="Enter PIN Code" />
			<View style={styles.content}>
				<Text01S style={styles.text} color="white5">
					{t('pin_send')}
				</Text01S>

				<PinPad onSuccess={(): void => onSuccess()} />
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

export default memo(PinCheck);
