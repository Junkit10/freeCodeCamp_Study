/* global  expect */
import { canRequestDonationSaga } from './current-challenge-saga';
import { types as appTypes } from '../../../redux';

describe('canRequestDonationSaga', () => {
  it('should call canRequestDonation', () => {
    const gen = canRequestDonationSaga();
    expect(gen.next().value.payload.action.type).toEqual(
      appTypes.canRequestDonation
    );
  });
});
