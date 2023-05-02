import React, { memo, ReactElement } from 'react';
import { Image, ImageSourcePropType, StyleSheet } from 'react-native';

import useColors from '../../hooks/colors';
import useDisplayValues from '../../hooks/displayValues';
import { TouchableOpacity } from '../../styles/components';
import { Subtitle } from '../../styles/text';
import { TPackage } from './CustomSetup';

const Barrel = ({
	id,
	amount,
	img,
	active,
	disabled = false,
	testID,
	onPress,
}: {
	id: TPackage['id'];
	amount: number;
	img: ImageSourcePropType;
	active: boolean;
	disabled?: boolean;
	testID?: string;
	onPress: (id: TPackage['id']) => void;
}): ReactElement => {
	const colors = useColors();
	const { fiatSymbol, fiatWhole } = useDisplayValues(amount);

	return (
		<TouchableOpacity
			style={[
				styles.root,
				active && { borderColor: colors.purple },
				disabled && styles.disabled,
			]}
			color={active ? 'purple32' : 'purple16'}
			activeOpacity={0.7}
			disabled={disabled}
			testID={testID}
			onPress={(): void => {
				if (!disabled) {
					onPress(id);
				}
			}}>
			<Image style={styles.image} source={img} />
			<Subtitle style={styles.amount}>
				{fiatSymbol} {fiatWhole}
			</Subtitle>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		justifyContent: 'space-between',
		alignItems: 'center',
		marginHorizontal: 8,
		borderRadius: 8,
		borderWidth: 1,
	},
	disabled: {
		opacity: 0.5,
	},
	image: {
		margin: 8,
		height: 100,
		width: 100,
		resizeMode: 'contain',
	},
	amount: {
		marginTop: 8,
		marginBottom: 16,
		textAlign: 'center',
	},
});

export default memo(Barrel);
