import React, { memo, ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { EItemType, IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { refreshWallet } from '../../../utils/wallet';
import { updateSelectedAddressType } from '../../../store/actions/wallet';
import { addressTypeSelector } from '../../../store/reselect/wallet';
import { EAddressType } from '../../../store/types/wallet';
import type { SettingsScreenProps } from '../../../navigation/types';

const addressTypes = [
	{
		type: EAddressType.p2wpkh,
		name: 'Native Segwit Bech32',
		description: 'Pay-to-witness-public-key-hash',
		example: '(bc1x...)',
	},
	{
		type: EAddressType.p2sh,
		name: 'Nested Segwit',
		description: 'Pay-to-Script-Hash',
		example: '(3x...)',
	},
	{
		type: EAddressType.p2pkh,
		name: 'Legacy',
		description: 'Pay-to-public-key-hash',
		example: '(1x...)',
	},
];

const AddressTypeSettings = ({
	navigation,
}: SettingsScreenProps<'AddressTypePreference'>): ReactElement => {
	const selectedAddressType = useSelector(addressTypeSelector);

	const listData: IListData[] = useMemo(
		() => [
			{
				title: 'Bitcoin address type',
				data: addressTypes.map((addressType) => ({
					type: EItemType.button,
					title: `${addressType.name} ${addressType.example}`,
					description: addressType.description,
					value: addressType.type === selectedAddressType,
					useCheckmark: true,
					onPress: async (): Promise<void> => {
						navigation.goBack();
						updateSelectedAddressType({ addressType: addressType.type });
						await refreshWallet({ lightning: false, onchain: true });
					},
				})),
			},
		],
		[selectedAddressType, navigation],
	);

	return (
		<SettingsView
			title="Bitcoin Address Type"
			listData={listData}
			showBackNavigation={true}
		/>
	);
};

export default memo(AddressTypeSettings);
