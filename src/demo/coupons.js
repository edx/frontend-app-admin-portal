import faker from 'faker';

import { configuration } from '../config';

const couponsCount = 360;
const codesCount = 15;

let firstCouponHasError = false;

// If development environment, let's set the first coupon to have an error for testing purposes.
if (configuration.NODE_ENV === 'development') {
  firstCouponHasError = true;
}

const coupons = [...Array(couponsCount)].map((_, index) => {
  const validFromDate = faker.date.past();
  const totalEnrollments = faker.random.number({ min: 1, max: 50 });
  return {
    id: index,
    title: faker.lorem.words(faker.random.number({ min: 1, max: 3 })).toUpperCase(),
    start_date: validFromDate.toISOString(),
    end_date: faker.date.future(null, validFromDate).toISOString(),
    num_unassigned: faker.random.number({ min: 1, max: 20 }),
    num_uses: faker.random.number({ min: 1, max: totalEnrollments }),
    max_uses: faker.random.boolean() ? totalEnrollments : null,
    has_error: false,
  };
});

const getAssignedTo = (isAssigned = false) => {
  if (!isAssigned) {
    return {};
  }

  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();
  const email = faker.internet.email(firstName, lastName, 'bestrun.com');

  return {
    name: `${firstName} ${lastName}`,
    email,
  };
};

const getCodes = (couponHasError = false) => {
  const redemptionsAvailablePerCode = faker.random.number({ min: 1, max: 5 });
  return [...Array(codesCount)].map((_, index) => {
    const codeHasError = couponHasError && index <= 1;
    const isAssigned = codeHasError || faker.random.boolean();
    const assignedTo = getAssignedTo(isAssigned);

    return {
      title: Math.random().toString(36).substring(2).toUpperCase(),
      assigned_to: assignedTo.email,
      redemptions: {
        available: redemptionsAvailablePerCode,
        used: isAssigned ? faker.random.number({
          min: 0,
          max: codeHasError ? redemptionsAvailablePerCode - 1 : redemptionsAvailablePerCode,
        }) : 0,
      },
      error: codeHasError ? `Unable to deliver email to ${assignedTo.name} (${assignedTo.email})` : null,
    };
  });
};

const getCodesCsv = () => 'assigned_to,code,redeem_url,redemptions.available,redemptions.used\r\n,ZBXF24QK6TJQMUSU,https://testserver.fake/coupons/offer/?code=ZBXF24QK6TJQMUSU,3,3\r\n,ZBXF24QK6TJQMUSU,https://testserver.fake/coupons/offer/?code=ZBXF24QK6TJQMUSU,3,3\r\n,ZBXF24QK6TJQMUSU,https://testserver.fake/coupons/offer/?code=ZBXF24QK6TJQMUSU,3,3\r\n,VF7TV7HMMQF63GS2,https://testserver.fake/coupons/offer/?code=VF7TV7HMMQF63GS2,3,3\r\n,VF7TV7HMMQF63GS2,https://testserver.fake/coupons/offer/?code=VF7TV7HMMQF63GS2,3,3\r\n,VF7TV7HMMQF63GS2,https://testserver.fake/coupons/offer/?code=VF7TV7HMMQF63GS2,3,3\r\n'

coupons[0].has_error = firstCouponHasError;

export {
  coupons,
  getCodes as codes,
  getCodesCsv as codesCsv,
};
