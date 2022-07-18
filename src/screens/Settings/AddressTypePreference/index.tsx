import React, { memo, ReactElement, useMemo, useState } from 'react';

import { IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { useSelector } from 'react-redux';
import Store from '../../../store/types';
import { getSelectedAddressType } from '../../../utils/wallet';
import { capitalize } from '../../../utils/helpers';
import { updateSelectedAddressType } from '../../../store/actions/wallet';
import { TAddressType } from '../../../store/types/wallet';

const AddressTypeSettings = (): ReactElement => {
	const [addressTypeState, setAddressTypeState] = useState<TAddressType>('');

	const typesDescriptions = {
		p2pkh: 'Pay-to-public-key-hash',
		p2wpkh: 'Pay-to-witness-public-key-hash',
		p2sh: 'Pay-to-Script-Hash',
	};

	const selectedWallet = useSelector(
		(state: Store) => state.wallet.selectedWallet,
	);

	const selectedNetwork = useSelector(
		(state: Store) => state.wallet.selectedNetwork,
	);

	const addressTypes = useSelector((state: Store) => state.wallet.addressTypes);

	const addressTypesList = useMemo(() => {
		return Object.values(addressTypes).map(({ label, type }) => {
			return { label: capitalize(label), value: type };
		});
	}, [addressTypes]);

	const selectedAddressType = useMemo(
		(): string =>
			getSelectedAddressType({
				selectedWallet,
				selectedNetwork,
			}),
		[selectedNetwork, selectedWallet],
	);

	const setAddressTypePreference = (preference: TAddressType): void => {
		setAddressTypeState(preference);
		return updateSelectedAddressType({
			addressType: preference,
		});
	};

	const checkAddressTypeListCheckmark = (type: TAddressType): boolean => {
		if (selectedAddressType === addressTypeState) {
			return addressTypeState === type;
		}
		if (addressTypeState === '') {
			return selectedAddressType === type;
		}
		return addressTypeState === type;
	};

	const AddressTypeListData: IListData[] = useMemo(
		() => [
			{
				title: 'Default Bitcoin address type',
				data: addressTypesList.map((bitcoinUnit) => ({
					useCheckmark: true,
					value: checkAddressTypeListCheckmark(bitcoinUnit.value),
					description: typesDescriptions[bitcoinUnit.value],
					title: `${bitcoinUnit.label}`,
					type: 'button',
					onPress: (): void => setAddressTypePreference(bitcoinUnit.value),
					hide: false,
				})),
			},
		],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[addressTypeState, addressTypesList, selectedAddressType],
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
