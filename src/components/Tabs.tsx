import React, { ReactElement, memo, useEffect, useState } from 'react';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import {
	StyleSheet,
	TouchableOpacity,
	View,
	GestureResponderEvent,
	StyleProp,
	ViewStyle,
	LayoutChangeEvent,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import colors from '../styles/colors';
import { CaptionB } from '../styles/text';
import { TActivityFilter } from '../utils/activity';

export type TTab = { id: string; filter: TActivityFilter };
type TTabLayout = { width: number; height: number; x: number; y: number };
type TTabLayouts = Record<string, TTabLayout>;
const initialTabLayout: TTabLayout = { width: 0, height: 0, x: 0, y: 0 };

const Tab = ({
	text,
	active = false,
	testID,
	onLayout,
	onPress,
}: {
	text: string;
	active?: boolean;
	testID?: string;
	onLayout: (event: LayoutChangeEvent) => void;
	onPress: (event: GestureResponderEvent) => void;
}): ReactElement => {
	return (
		<TouchableOpacity
			style={styles.tab}
			activeOpacity={0.7}
			testID={testID}
			onLayout={onLayout}
			onPress={onPress}>
			<CaptionB color={active ? 'white' : 'secondary'}>{text}</CaptionB>
		</TouchableOpacity>
	);
};

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
	const activeTabLayout = useSharedValue<TTabLayout>(initialTabLayout);
	const [layouts, setLayouts] = useState<TTabLayouts>({});

	useEffect(() => {
		// Set the active tab layout when the active tab changes
		const layout = layouts[tabs[activeTab].id];
		if (layout) {
			activeTabLayout.value = withTiming(layout);
		}
	}, [activeTab, layouts, tabs, activeTabLayout]);

	const animatedStyle = useAnimatedStyle(() => {
		return {
			height: activeTabLayout.value.height,
			top: activeTabLayout.value.y,
			width: activeTabLayout.value.width,
			left: activeTabLayout.value.x,
		};
	});

	const handleLayout = (
		id: string,
		event: LayoutChangeEvent,
		index: number,
	): void => {
		const { layout } = event.nativeEvent;
		setLayouts((prevLayouts) => ({ ...prevLayouts, [id]: layout }));

		if (index === activeTab) {
			// Set the active tab layout on initial render
			activeTabLayout.value = layout;
		}
	};

	return (
		<View style={[styles.root, style]} testID="Tabs">
			<Animated.View style={[styles.activeTab, animatedStyle]} />
			{tabs.map((tab, index) => (
				<Tab
					key={tab.id}
					text={t(`activity_tabs.${tab.id}`)}
					active={activeTab === index}
					testID={`Tab-${tab.id}`}
					onLayout={(event) => handleLayout(tab.id, event, index)}
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
		borderBottomWidth: 2,
		borderColor: colors.brand,
		position: 'absolute',
		zIndex: 1,
	},
});

export default memo(Tabs);
