import React, { memo, ReactElement } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import { TouchableHighlight } from '../../styles/components';
import { Caption13Up } from '../../styles/text';
import { SwitchIcon } from '../../styles/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import useColors from '../../hooks/colors';
import { updateUi } from '../../store/slices/ui';

const AssetButton = ({
	style,
	savings,
	spending,
}: {
	style?: StyleProp<ViewStyle>;
	savings?: boolean;
	spending?: boolean;
}): ReactElement => {
	const { t } = useTranslation('wallet');
	const colors = useColors();
	const dispatch = useAppDispatch();
	const method = useAppSelector((state) => state.ui.paymentMethod);

	const usesLightning = method === 'lightning';

	const canSwitch = savings && spending;
	const text = usesLightning ? t('spending.title') : t('savings.title');
	const testId = usesLightning ? 'spending' : 'savings';
	const borderColor = usesLightning ? colors.purple : colors.brand;
	const color = usesLightning ? 'purple' : 'brand';

	const staticStyle = {
		borderWidth: 1,
		borderColor,
		height: 28,
	};

	const onSwitch = (): void => {
		const paymentMethod = usesLightning ? 'onchain' : 'lightning';
		dispatch(updateUi({ paymentMethod }));
	};

	if (!canSwitch) {
		return (
			<View
				style={[styles.root, staticStyle, style]}
				testID={`AssetButton-${testId}`}>
				<Caption13Up color={color}>{text}</Caption13Up>
			</View>
		);
	}

	return (
		<TouchableHighlight
			style={[styles.root, style]}
			color="white10"
			testID="AssetButton-switch"
			onPressIn={onSwitch}>
			<>
				<SwitchIcon
					style={styles.icon}
					color={color}
					width={16.44}
					height={13.22}
				/>
				<Caption13Up color={color}>{text}</Caption13Up>
			</>
		</TouchableHighlight>
	);
};

const styles = StyleSheet.create({
	root: {
		paddingVertical: 5,
		paddingHorizontal: 8,
		borderRadius: 8,
		flexDirection: 'row',
		alignItems: 'center',
	},
	icon: {
		marginRight: 11,
	},
});

export default memo(AssetButton);
