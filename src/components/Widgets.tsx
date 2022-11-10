import React, { memo, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

import { navigate } from '../navigation/root/RootNavigator';
import Store from '../store/types';
import {
	PlusIcon,
	Subtitle,
	Text01M,
	TouchableOpacity,
	View,
} from '../styles/components';
import BitfinexWidget from './BitfinexWidget';
import AuthWidget from './AuthWidget';
import FeedWidget from './FeedWidget';
import HeadlinesWidget from './HeadlinesWidget';
import { SUPPORTED_FEED_TYPES } from '../utils/widgets';
import BlocksWidget from './BlocksWidget';

export const Widgets = (): ReactElement => {
	const widgets = useSelector((state: Store) => state.widgets.widgets);

	return (
		<>
			<Subtitle style={styles.title}>Widgets</Subtitle>
			<View>
				{Object.entries(widgets).map(([url, widget]) =>
					widget.feed ? (
						((): ReactElement => {
							switch (widget.feed.type) {
								case SUPPORTED_FEED_TYPES.PRICE_FEED:
									return <BitfinexWidget key={url} url={url} widget={widget} />;
								case SUPPORTED_FEED_TYPES.HEADLINES_FEED:
									return (
										<HeadlinesWidget key={url} url={url} widget={widget} />
									);
								case SUPPORTED_FEED_TYPES.BLOCKS_FEED:
									return <BlocksWidget key={url} url={url} widget={widget} />;
								default:
									return <FeedWidget key={url} url={url} widget={widget} />;
							}
						})()
					) : (
						<AuthWidget key={url} url={url} widget={widget} />
					),
				)}
				<TouchableOpacity
					style={styles.add}
					onPress={(): void => {
						navigate('WidgetsRoot');
					}}>
					<View color="green16" style={styles.iconCircle}>
						<PlusIcon height={16} color="green" />
					</View>
					<Text01M>Add Widget</Text01M>
				</TouchableOpacity>
			</View>
		</>
	);
};

const styles = StyleSheet.create({
	title: {
		marginTop: 32,
		marginBottom: 8,
	},
	add: {
		height: 88,
		flexDirection: 'row',
		alignItems: 'center',
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
	},
	iconCircle: {
		borderRadius: 20,
		width: 32,
		height: 32,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
});

export default memo(Widgets);
