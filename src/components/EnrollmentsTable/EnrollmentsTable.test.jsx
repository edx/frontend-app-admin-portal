import React from 'react';
import renderer from 'react-test-renderer';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';

import EnrollmentsTable from './index';
// import EnterpriseDataApiService from '../../data/services/EnterpriseDataApiService';
// import { mockEnrollmentFetchResponse } from './EnrollmentsTable.mocks';

const mockStore = configureMockStore([thunk]);
const store = mockStore({
  table: {
    enrollments: {
      data: {
        results: [],
        current_page: 1,
        num_pages: 1,
      },
      ordering: null,
      loading: false,
      error: null,
    },
  },
});

const EnrollmentsWrapper = props => (
  <Provider store={store}>
    <EnrollmentsTable
      {...props}
    />
  </Provider>
);

describe('EnrollmentsTable', () => {
  it('renders empty state correctly', () => {
    const tree = renderer
      .create((
        <EnrollmentsWrapper />
      ))
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  // TODO: This test is not snapshotting the full table properly
  // it('renders a full table correctly', () => {
  //   EnterpriseDataApiService.fetchCourseEnrollments = jest.fn(() =>
  //     Promise.resolve(mockEnrollmentFetchResponse));

  //   const tree = renderer
  //     .create((
  //       <EnrollmentsWrapper />
  //     ))
  //     .toJSON();
  //   expect(EnterpriseDataApiService.fetchCourseEnrollments).toHaveBeenCalled();
  //   expect(tree).toMatchSnapshot();
  // });
});
