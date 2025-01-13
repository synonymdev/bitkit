import { createSelectorCreator, lruMemoize } from '@reduxjs/toolkit';
import { shallowEqual } from 'react-redux';
import { RootState } from '..';

export const createShallowEqualSelector = createSelectorCreator(
	lruMemoize,
	shallowEqual,
).withTypes<RootState>();
