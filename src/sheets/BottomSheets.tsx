import React, { JSX, memo } from 'react';

import BackupNavigation from './BackupNavigation';
import Boost from './Boost';
import ConnectionClosed from './ConnectionClosed';
import GiftNavigation from './GiftNavigation';
import LNURLWithdrawNavigation from './LNURLWithdrawNavigation';
import OrangeTicketNavigation from './OrangeTicketNavigation';
import PINNavigation from './PINNavigation';
// import TransferFailed from './TransferFailed';
// import TreasureHuntNavigation from './TreasureHuntNavigation';
import PubkyAuth from './PubkyAuth';
import ReceiveNavigation from './ReceiveNavigation';
import ReceivedTransaction from './ReceivedTransaction';
import SendNavigation from './SendNavigation';

const BottomSheets = (): JSX.Element => {
	return (
		<>
			<BackupNavigation />
			<Boost />
			<ConnectionClosed />
			<GiftNavigation />
			<LNURLWithdrawNavigation />
			<ReceivedTransaction />
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
