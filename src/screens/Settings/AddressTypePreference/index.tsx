import React, { memo, ReactElement, useMemo, useState } from 'react';

import { IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { useSelector } from 'react-redux';
import Store from '../../../store/types';
import { capitalize } from '../../../utils/helpers';
import { updateSelectedAddressType } from '../../../store/actions/wallet';
import { TAddressType } from '../../../store/types/wallet';

const AddressTypeSettings = (): ReactElement => {
	const typesDescriptions = {
		p2pkh: 'Pay-to-public-key-hash',
		p2wpkh: 'Pay-to-witness-public-key-hash',
		p2sh: 'Pay-to-Script-Hash',
	};

	const [selectedAddressTypeState, setSelectedAddressTypeState] =
		useState<TAddressType>('p2pkh');

	const addressTypes = useSelector((state: Store) => state.wallet.addressTypes);

	const addressTypesList = useMemo(() => {
		return Object.values(addressTypes).map(({ label, type }) => {
			return { label: capitalize(label), value: type };
		});
	}, [addressTypes]);

	const setAddressTypePreference = (preference: TAddressType): void => {
		setSelectedAddressTypeState(preference);
		return updateSelectedAddressType({
			addressType: preference,
		});
	};

	const AddressTypeListData: IListData[] = useMemo(
		() => {
			return [
				{
					title: 'Default Bitcoin address type',
					data: addressTypesList.map((bitcoinUnit) => ({
						useCheckmark: true,
						value: selectedAddressTypeState === bitcoinUnit.value,
						description: typesDescriptions[bitcoinUnit.value],
						title: `${bitcoinUnit.label}`,
						type: 'button',
						onPress: (): void => setAddressTypePreference(bitcoinUnit.value),
						hide: false,
					})),
				},
			];
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[selectedAddressTypeState],
	);

	return (
		<SettingsView
			title={'Address types preference'}
			listData={AddressTypeListData}
			showBackNavigation
		/>
	);
};

export default memo(AddressTypeSettings);
