import React, { memo, ReactElement } from 'react';
import {
	StyleProp,
	StyleSheet,
	TouchableOpacity,
	View,
	ViewStyle,
} from 'react-native';

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
	style,
}: {
	balance: number;
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
				<Money
					sats={balance}
					unitType="secondary"
					color="secondary"
					size="caption13Up"
					enableHide={true}
					symbol={true}
				/>
			</View>

			<DetectSwipe
				enabled={enableHide}
				onSwipeLeft={toggleHideBalance}
				onSwipeRight={toggleHideBalance}>
				<TouchableOpacity
					style={styles.balance}
					activeOpacity={0.7}
					testID="TotalBalance"
					onPress={onSwitchUnit}>
					<Money sats={balance} enableHide={true} symbol={true} />
					{hideBalance && (
						<TouchableOpacity
							activeOpacity={0.7}
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
