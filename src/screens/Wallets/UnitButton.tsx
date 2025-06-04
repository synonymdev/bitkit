import React, { memo, ReactElement } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useAppSelector } from '../../hooks/redux';

import { useCurrency } from '../../hooks/displayValues';
import { useSwitchUnit } from '../../hooks/wallet';
import { unitSelector } from '../../store/reselect/settings';
import { EUnit } from '../../store/types/wallet';
import { TouchableHighlight } from '../../styles/components';
import { SwitchIcon } from '../../styles/icons';
import { Caption13Up } from '../../styles/text';
import { IThemeColors } from '../../styles/themes';

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
		<TouchableHighlight
			style={[styles.root, style]}
			color="white10"
			testID={testID}
			onPressIn={onSwitchUnit}>
			<View style={styles.container}>
				<SwitchIcon color={color} width={16.44} height={13.22} />
				<Caption13Up style={styles.text} color={color}>
					{unit === EUnit.BTC ? 'Bitcoin' : fiatTicker}
				</Caption13Up>
			</View>
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
	container: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	text: {
		marginLeft: 11,
	},
});

export default memo(UnitButton);
