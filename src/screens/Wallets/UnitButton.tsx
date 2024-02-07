import React, { memo, ReactElement } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useAppSelector } from '../../hooks/redux';

import { TouchableOpacity } from '../../styles/components';
import { Caption13Up } from '../../styles/text';
import { SwitchIcon } from '../../styles/icons';
import { useCurrency } from '../../hooks/displayValues';
import { unitSelector } from '../../store/reselect/settings';
import { EUnit } from '../../store/types/wallet';
import { IThemeColors } from '../../styles/themes';
import { useSwitchUnit } from '../../hooks/wallet';

const UnitButton = ({
	color = 'brand',
	style,
	testID = 'UnitButton',
	onPress,
}: {
	color?: keyof IThemeColors;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	onPress: () => void;
}): ReactElement => {
	const switchUnit = useSwitchUnit();
	const { fiatTicker } = useCurrency();
	const unit = useAppSelector(unitSelector);

	const onSwitchUnit = (): void => {
		onPress();
		switchUnit();
	};

	return (
		<TouchableOpacity
			style={[styles.root, style]}
			color="white10"
			testID={testID}
			onPress={onSwitchUnit}>
			<SwitchIcon color={color} width={16.44} height={13.22} />
			<Caption13Up style={styles.text} color={color}>
				{unit === EUnit.BTC ? 'BTC' : fiatTicker}
			</Caption13Up>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	root: {
		paddingVertical: 7,
		paddingHorizontal: 8,
		borderRadius: 8,
		flexDirection: 'row',
		alignItems: 'center',
	},
	text: {
		marginLeft: 11,
	},
});

export default memo(UnitButton);
