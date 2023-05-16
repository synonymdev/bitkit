import React, { memo, ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { EItemType, IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { refreshWallet } from '../../../utils/wallet';
import { updateSelectedAddressType } from '../../../store/actions/wallet';
import { addressTypeSelector } from '../../../store/reselect/wallet';
import { addressTypes } from '../../../store/shapes/wallet';
import type { SettingsScreenProps } from '../../../navigation/types';

const AddressTypeSettings = ({
	navigation,
}: SettingsScreenProps<'AddressTypePreference'>): ReactElement => {
	const { t } = useTranslation('settings');
	const selectedAddressType = useSelector(addressTypeSelector);

	const listData: IListData[] = useMemo(
		() => [
			{
				title: t('adv.address_type'),
				data: Object.values(addressTypes).map((addressType) => ({
					type: EItemType.button,
					title: `${addressType.name} ${addressType.example}`,
					description: addressType.description,
					value: addressType.type === selectedAddressType,
					useCheckmark: true,
					onPress: async (): Promise<void> => {
						navigation.goBack();
						await updateSelectedAddressType({ addressType: addressType.type });
						await refreshWallet({ lightning: false, onchain: true });
					},
					testID: addressType.type,
				})),
			},
		],
		[selectedAddressType, navigation, t],
	);

	return (
		<SettingsView
			title={t('adv.address_type')}
			listData={listData}
			showBackNavigation={true}
		/>
	);
};

export default memo(AddressTypeSettings);
