import React, { memo, ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
	GestureResponderEvent,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';

import useColors from '../../../hooks/colors';
import { useDisplayValues } from '../../../hooks/displayValues';
import { EFeeId } from '../../../store/types/fees';
import {
	SettingsIcon,
	SpeedFastIcon,
	SpeedNormalIcon,
	SpeedSlowIcon,
} from '../../../styles/icons';
import { BodyMSB, BodySSB } from '../../../styles/text';

const FeeItem = ({
	id,
	sats,
	isSelected = false,
	isDisabled = false,
	onPress,
}: {
	id: EFeeId;
	sats: number;
	isSelected?: boolean;
	isDisabled?: boolean;
	onPress?: (event: GestureResponderEvent) => void;
}): ReactElement => {
	const colors = useColors();
	const { t } = useTranslation('fee');
	const title = t(`${id}.title`);
	const description = t(`${id}.description`);
	const totalFeeDisplay = useDisplayValues(sats);

	const icon = useMemo(() => {
		switch (id) {
			case EFeeId.fast:
				return <SpeedFastIcon color={isDisabled ? 'gray3' : 'brand'} />;
			case EFeeId.normal:
				return <SpeedNormalIcon color={isDisabled ? 'gray3' : 'brand'} />;
			case EFeeId.slow:
				return <SpeedSlowIcon color={isDisabled ? 'gray3' : 'brand'} />;
			case EFeeId.custom:
				return (
					<SettingsIcon
						color={isDisabled ? 'gray3' : 'secondary'}
						width={32}
						height={32}
					/>
				);
		}
	}, [id, isDisabled]);

	return (
		<>
			<View style={styles.divider} />
			<TouchableOpacity
				style={[styles.root, isSelected && { backgroundColor: colors.white06 }]}
				activeOpacity={0.7}
				onPress={isDisabled ? undefined : onPress}>
				<View style={styles.imageContainer}>{icon}</View>

				<View style={styles.row}>
					<View style={styles.cell}>
						<BodyMSB color={isDisabled ? 'gray3' : undefined}>{title}</BodyMSB>
						{sats !== 0 && (
							<View style={styles.sats}>
								<BodyMSB color={isDisabled ? 'gray3' : undefined}>
									<BodyMSB color={isDisabled ? 'gray3' : 'secondary'}>
										₿
									</BodyMSB>{' '}
									{sats}
								</BodyMSB>
							</View>
						)}
					</View>
					<View style={styles.cell}>
						<BodySSB color={isDisabled ? 'gray3' : 'secondary'}>
							{description}
						</BodySSB>
						{sats !== 0 && (
							<BodySSB color={isDisabled ? 'gray3' : 'secondary'}>
								{totalFeeDisplay.fiatSymbol} {totalFeeDisplay.fiatFormatted}
							</BodySSB>
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
