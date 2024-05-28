import React, { ReactElement, memo } from 'react';
import Animated, {
	useAnimatedStyle,
	withTiming,
} from 'react-native-reanimated';
import {
	StyleSheet,
	TouchableOpacity,
	View,
	GestureResponderEvent,
	useWindowDimensions,
	StyleProp,
	ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import colors from '../styles/colors';
import { CaptionB } from '../styles/text';
import { TActivityFilter } from '../utils/activity';

export type TTab = {
	id: string;
	filter: TActivityFilter;
};

const Tab = ({
	text,
	active = false,
	testID,
	onPress,
}: {
	text: string;
	active?: boolean;
	testID?: string;
	onPress: (event: GestureResponderEvent) => void;
}): ReactElement => (
	<TouchableOpacity
		style={styles.tab}
		activeOpacity={0.8}
		testID={testID}
		onPress={onPress}>
		<CaptionB color={active ? 'white' : 'secondary'}>{text}</CaptionB>
	</TouchableOpacity>
);

const Tabs = ({
	tabs,
	activeTab,
	style,
	onPress,
}: {
	tabs: TTab[];
	activeTab: number;
	style?: StyleProp<ViewStyle>;
	onPress: (index: number) => void;
}): ReactElement => {
	const { t } = useTranslation('wallet');
	const { width: windowWidth } = useWindowDimensions();

	const tabGap = 4;
	const tabsWidth = windowWidth - 32;
	const tabWidth = (tabsWidth - tabGap * tabs.length) / tabs.length;

	const animatedTabStyle = useAnimatedStyle(() => {
		return { left: withTiming((tabWidth + tabGap) * activeTab) };
	}, [tabWidth, activeTab]);

	return (
		<View style={[styles.root, style]} testID="Tabs">
			<Animated.View
				style={[styles.activeTab, animatedTabStyle, { width: tabWidth }]}
			/>
			{tabs.map((tab, index) => (
				<Tab
					key={tab.id}
					text={t('activity_tabs.' + tab.id)}
					active={activeTab === index}
					testID={`Tab-${tab.id}`}
					onPress={(): void => onPress(index)}
				/>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		flexDirection: 'row',
		gap: 4,
	},
	tab: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		borderBottomWidth: 2,
		borderColor: colors.white64,
		paddingVertical: 10,
	},
	activeTab: {
		backgroundColor: colors.brand,
		height: 2,
		position: 'absolute',
		top: '95%',
		zIndex: 1,
	},
});

export default memo(Tabs);
