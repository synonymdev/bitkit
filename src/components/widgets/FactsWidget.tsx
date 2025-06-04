import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { TFactsWidgetOptions } from '../../store/types/widgets';
import { CaptionB, Title } from '../../styles/text';
import { getRandomFact } from '../../utils/widgets';
import BaseWidget from './BaseWidget';

const FactsWidget = ({
	options,
	isEditing = false,
	style,
	testID,
	onPressIn,
	onLongPress,
}: {
	options: TFactsWidgetOptions;
	isEditing?: boolean;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	onPressIn?: () => void;
	onLongPress?: () => void;
}): ReactElement => {
	const { t } = useTranslation('widgets');
	const fact = getRandomFact();

	return (
		<BaseWidget
			id="facts"
			isEditing={isEditing}
			style={style}
			testID={testID}
			onPressIn={onPressIn}
			onLongPress={onLongPress}>
			<Title numberOfLines={2}>{fact}</Title>
			{options.showSource && (
				<View style={styles.source}>
					<View style={styles.columnLeft}>
						<CaptionB color="secondary" numberOfLines={1}>
							{t('widget.source')}
						</CaptionB>
					</View>
					<View style={styles.columnRight}>
						<CaptionB color="secondary" numberOfLines={1}>
							synonym.to
						</CaptionB>
					</View>
				</View>
			)}
		</BaseWidget>
	);
};

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		minHeight: 28,
	},
	columnLeft: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
	},
	columnRight: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
	},
	source: {
		marginTop: 16,
		flexDirection: 'row',
		alignItems: 'center',
	},
});

export default FactsWidget;
