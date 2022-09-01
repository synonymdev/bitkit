import React, { memo, ReactElement, useCallback } from 'react';
import AssetPickerList from '../../../components/AssetPickerList';
import { useBottomSheetBackPress } from '../../../hooks/bottomSheet';

const SendAssetPickerList = ({ navigation }): ReactElement => {
	useBottomSheetBackPress('sendNavigation');

	const onAssetPress = useCallback(
		(asset) => {
			navigation.navigate('AddressAndAmount', { asset });
		},
		[navigation],
	);

	return (
		<AssetPickerList
			headerTitle="Send Bitcoin"
			side="send"
			onAssetPress={onAssetPress}
		/>
	);
};

export default memo(SendAssetPickerList);
