import React, {
	memo,
	ReactElement,
	ReactNode,
	useCallback,
	useMemo,
} from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppSelector } from '../../hooks/redux';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Caption13Up, BodySSB } from '../../styles/text';
import { groupActivityItems } from '../../utils/activity';
import { showBottomSheet } from '../../store/utils/ui';
import { IActivityItem } from '../../store/types/activity';
import { activityItemsSelector } from '../../store/reselect/activity';
import Button from '../../components/Button';
import ListItem, { EmptyItem } from './ListItem';
import type { RootNavigationProp } from '../../navigation/types';

const MAX_ACTIVITY_ITEMS = 3;

const ActivityListShort = (): ReactElement => {
	const { t } = useTranslation('wallet');
	const navigation = useNavigation<RootNavigationProp>();
	const items = useAppSelector(activityItemsSelector);

	const groupedItems = useMemo(() => {
		const activityItems = items.slice(0, MAX_ACTIVITY_ITEMS);
		return groupActivityItems(activityItems);
	}, [items]);

	const renderItem = useCallback(
		({
			item,
			index,
		}: {
			// eslint-disable-next-line react/no-unused-prop-types
			item: string | IActivityItem;
			// eslint-disable-next-line react/no-unused-prop-types
			index: number;
		}): ReactNode => {
			if (typeof item === 'string') {
				return;
			}

			return (
				<ListItem
					key={item.id}
					item={item}
					onPress={(): void =>
						navigation.navigate('ActivityDetail', { id: item.id })
					}
					testID={`ActivityShort-${index}`}
				/>
			);
		},
		[navigation],
	);

	const navigateToReceive = useCallback((): void => {
		showBottomSheet('receiveNavigation');
	}, []);

	const navigateToActivityFiltered = useCallback((): void => {
		navigation.navigate('Wallet', { screen: 'ActivityFiltered' });
	}, [navigation]);

	return (
		<View style={styles.content}>
			<Caption13Up color="secondary" style={styles.title}>
				{t('activity')}
			</Caption13Up>

			{groupedItems.length === 0 ? (
				<EmptyItem onPress={navigateToReceive} />
			) : (
				<>
					{groupedItems.map((item, index) => (
						<React.Fragment key={index}>
							{renderItem({ item, index })}
						</React.Fragment>
					))}
					<Button
						style={styles.button}
						text={<BodySSB color="white80">{t('activity_show_all')}</BodySSB>}
						size="large"
						variant="transparent"
						testID="ActivityShowAll"
						onPress={navigateToActivityFiltered}
					/>
				</>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	content: {
		paddingTop: 32,
		marginBottom: 32,
	},
	title: {
		marginBottom: 23,
	},
	button: {
		marginTop: -24,
	},
});

export default memo(ActivityListShort);
