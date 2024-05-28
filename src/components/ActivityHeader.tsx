import React, { memo, ReactElement } from 'react';
import {
	StyleProp,
	StyleSheet,
	TouchableOpacity,
	View,
	ViewStyle,
} from 'react-native';

import { Caption13Up } from '../styles/text';
import { EyeIcon } from '../styles/icons';
import Money from './Money';
import DetectSwipe from './DetectSwipe';
import { useSwitchUnitAnnounced } from '../hooks/wallet';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { updateSettings } from '../store/slices/settings';
import {
	enableSwipeToHideBalanceSelector,
	hideBalanceSelector,
} from '../store/reselect/settings';

const ActivityHeader = ({
	balance,
	label,
	style,
}: {
	balance: number;
	label?: string;
	style?: StyleProp<ViewStyle>;
}): ReactElement => {
	const dispatch = useAppDispatch();
	const onSwitchUnit = useSwitchUnitAnnounced();
	const hideBalance = useAppSelector(hideBalanceSelector);
	const enableHide = useAppSelector(enableSwipeToHideBalanceSelector);

	const toggleHideBalance = (): void => {
		dispatch(updateSettings({ hideBalance: !hideBalance }));
	};

	return (
		<View style={style}>
			<View style={styles.label}>
				<Caption13Up color="secondary">{label}</Caption13Up>
			</View>

			<DetectSwipe
				enabled={enableHide}
				onSwipeLeft={toggleHideBalance}
				onSwipeRight={toggleHideBalance}>
				<TouchableOpacity
					style={styles.balance}
					testID="TotalBalance"
					onPress={onSwitchUnit}>
					<Money sats={balance} enableHide={true} symbol={true} />
					{hideBalance && (
						<TouchableOpacity
							hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
							testID="ShowBalance"
							onPress={toggleHideBalance}>
							<EyeIcon />
						</TouchableOpacity>
					)}
				</TouchableOpacity>
			</DetectSwipe>
		</View>
	);
};

const styles = StyleSheet.create({
	label: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	balance: {
		marginTop: 16,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
});

export default memo(ActivityHeader);
