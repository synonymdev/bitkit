import React, { JSX, memo } from 'react';
// import { useAppSelector } from '../../hooks/redux';
// import { viewControllersSelector } from '../../store/reselect/ui';
// import TransferFailed from '../bottom-sheet/TransferFailed';

import BoostPrompt from '../../screens/Wallets/BoostPrompt';
import NewTxPrompt from '../../screens/Wallets/NewTxPrompt';
import BackupNavigation from './BackupNavigation';
import ConnectionClosed from './ConnectionClosed';
import LNURLWithdrawNavigation from './LNURLWithdrawNavigation';
import OrangeTicketNavigation from './OrangeTicketNavigation';
import PINNavigation from './PINNavigation';
// import TreasureHuntNavigation from './TreasureHuntNavigation';
import PubkyAuth from './PubkyAuth';
import ReceiveNavigation from './ReceiveNavigation';
import SendNavigation from './SendNavigation';

const BottomSheets = (): JSX.Element => {
	// const views = useAppSelector(viewControllersSelector);

	return (
		<>
			<BackupNavigation />
			<BoostPrompt />
			<ConnectionClosed />
			<LNURLWithdrawNavigation />
			<NewTxPrompt />
			<OrangeTicketNavigation />
			<PINNavigation />
			<ReceiveNavigation />
			<SendNavigation />
			{/* <TreasureHuntNavigation /> */}
			<PubkyAuth />
		</>
	);
};

export default memo(BottomSheets);
