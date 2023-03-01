import React, { memo, ReactElement, useMemo } from 'react';
import {
	StyleSheet,
	View,
	TouchableOpacity,
	GestureResponderEvent,
} from 'react-native';

import { Text01M, Text02M } from '../../../styles/text';
import {
	LightningIcon,
	SettingsIcon,
	SpeedFastIcon,
	SpeedNormalIcon,
	SpeedSlowIcon,
} from '../../../styles/icons';
import { EFeeId } from '../../../store/types/fees';
import useColors from '../../../hooks/colors';
import useDisplayValues from '../../../hooks/displayValues';
import { FeeText } from '../../../store/shapes/fees';

const FeeItem = ({
	id,
	sats,
	isSelected = false,
	onPress,
}: {
	id: EFeeId;
	sats: number;
	isSelected?: boolean;
	onPress?: (event: GestureResponderEvent) => void;
}): ReactElement => {
	const colors = useColors();
	const { title, description } = FeeText[id];
	const totalFeeDisplay = useDisplayValues(sats);

	const icon = useMemo(() => {
		switch (id) {
			case EFeeId.instant:
				return <SpeedFastIcon color="purple" />;
			case EFeeId.fast:
				return <SpeedFastIcon color="brand" />;
			case EFeeId.normal:
				return <SpeedNormalIcon color="brand" />;
			case EFeeId.slow:
				return <SpeedSlowIcon color="brand" />;
			case EFeeId.custom:
				return <SettingsIcon color="gray1" width={32} height={32} />;
		}
	}, [id]);

	return (
		<>
			<View style={styles.divider} />
			<TouchableOpacity
				onPress={onPress}
				style={[
					styles.root,
					isSelected && { backgroundColor: colors.white04 },
				]}>
				<View style={styles.imageContainer}>{icon}</View>

				<View style={styles.row}>
					<View style={styles.cell}>
						<Text01M>{title}</Text01M>
						{sats !== 0 && (
							<View style={styles.sats}>
								<LightningIcon height={16} color="gray1" />
								<Text01M>{sats}</Text01M>
							</View>
						)}
					</View>
					<View style={styles.cell}>
						<Text02M color="gray1">{description}</Text02M>
						{sats !== 0 && (
							<Text02M color="gray1">
								{totalFeeDisplay.fiatSymbol} {totalFeeDisplay.fiatFormatted}
							</Text02M>
						)}
					</View>
				</View>
			</TouchableOpacity>
		</>
	);
};

const styles = StyleSheet.create({
	root: {
		flexDirection: 'row',
		paddingRight: 16,
		alignContent: 'center',
		justifyContent: 'center',
		height: 90,
	},
	imageContainer: {
		position: 'relative',
		justifyContent: 'center',
		alignItems: 'center',
		width: 64,
	},
	row: {
		flex: 1,
		justifyContent: 'center',
		alignContent: 'center',
	},
	cell: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignContent: 'center',
	},
	sats: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	divider: {
		marginHorizontal: 16,
		borderBottomWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.1)',
	},
});

export default memo(FeeItem);
