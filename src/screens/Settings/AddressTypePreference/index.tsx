import React, { memo, ReactElement, useMemo, useState } from 'react';

import { IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { useSelector } from 'react-redux';
import Store from '../../../store/types';
import { getSelectedAddressType, refreshWallet } from '../../../utils/wallet';
import { capitalize } from '../../../utils/helpers';
import { updateSelectedAddressType } from '../../../store/actions/wallet';
import { TAddressType } from '../../../store/types/wallet';
import { updateSettings } from '../../../store/actions/settings';
import { updateAddressIndexes } from '../../../store/actions/wallet';

const AddressTypeSettings = ({ navigation }): ReactElement => {
	const [addressTypeState, setAddressTypeState] = useState<TAddressType>('');

	const typesDescriptions = {
		p2wpkh: {
			description: 'Pay-to-witness-public-key-hash',
			example: '(bc1x...)',
		},
		p2sh: { description: 'Pay-to-Script-Hash', example: '(3x...)' },
		p2pkh: { description: 'Pay-to-public-key-hash', example: '(1x...)' },
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
		updateSelectedAddressType({
			addressType: preference,
		});
		refreshWallet({}).then();
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
				title: 'Bitcoin address type',
				data: addressTypesList.map((bitcoinUnit) => ({
					useCheckmark: true,
					value: checkAddressTypeListCheckmark(bitcoinUnit.value),
					description: typesDescriptions[bitcoinUnit.value].description,
					title: `${bitcoinUnit.label} ${
						typesDescriptions[bitcoinUnit.value].example
					}`,
					type: 'button',
					onPress: (): void => {
						navigation.goBack();
						updateSettings({ addressType: bitcoinUnit.value });
						setAddressTypePreference(bitcoinUnit.value);
						updateAddressIndexes({
							selectedWallet,
							selectedNetwork,
							addressType: bitcoinUnit.value,
						}).then();
					},
					hide: false,
				})),
			},
		],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[addressTypeState, addressTypesList, selectedAddressType],
	);

	return (
		<SettingsView
			title={'Bitcoin Address Type'}
			listData={AddressTypeListData}
			showBackNavigation
		/>
	);
};

export default memo(AddressTypeSettings);
