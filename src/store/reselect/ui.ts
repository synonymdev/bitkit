import Store from '../types';
import { createSelector } from '@reduxjs/toolkit';
import { IUi, TProfileLink } from '../types/ui';

const uiState = (state: Store): IUi => state.ui;

export const profileLinkSelector = createSelector(
	[uiState],
	(ui): TProfileLink => ui.profileLink,
);
