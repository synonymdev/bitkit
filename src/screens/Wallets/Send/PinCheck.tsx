import React, { ReactElement, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import type { SendScreenProps } from '../../../navigation/types';
import { BodyM } from '../../../styles/text';
import SendPinPad from './SendPinPad';

const PinCheck = ({ route }: SendScreenProps<'PinCheck'>): ReactElement => {
	const { onSuccess } = route.params;
	const { t } = useTranslation('security');

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title={t('pin_send_title')} />
			<View style={styles.content}>
				<BodyM style={styles.text} color="secondary">
					{t('pin_send')}
				</BodyM>

				<SendPinPad onSuccess={onSuccess} />
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
