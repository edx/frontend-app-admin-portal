import React from 'react';
import { act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { SearchContext } from '@edx/frontend-enterprise';
import { Button } from '@edx/paragon';
import Skeleton from 'react-loading-skeleton';
import { useAllSubscriptionUsers } from '../subscriptions/data/hooks';
import StatusAlert from '../StatusAlert';
import BulkEnrollContextProvider from './BulkEnrollmentContext';
import {
  BaseCourseSearchResults, EnrollButton, NO_DATA_MESSAGE, TABLE_HEADERS, ENROLL_TEXT,
} from './CourseSearchResults';
import BulkEnrollmentStepper from './stepper/BulkEnrollmentStepper';

const mockStore = configureMockStore([thunk]);

// Mocking this connected component so as not to have to mock the algolia Api
jest.mock('@edx/frontend-enterprise', () => ({
  ...jest.requireActual('@edx/frontend-enterprise'),
  SearchPagination: () => <div>PAGINATE ME</div>,
}));

jest.mock('../subscriptions/data/hooks', () => ({
  useAllSubscriptionUsers: jest.fn(),
}));

useAllSubscriptionUsers.mockReturnValue([{
  results: [],
  count: 0,
}, false]);

const testCourseName = 'TestCourseName';
const testCourseRunKey = 'TestCourseRun';
const testStartDate = '2020-09-10T04:00:00Z';

const searchResults = {
  nbHits: 1,
  hitsPerPage: 10,
  pageIndex: 10,
  pageCount: 5,
  nbPages: 6,
  hits: [
    {
      title: testCourseName,
      advertised_course_run: {
        key: testCourseRunKey,
        start: testStartDate,
      },
    },
  ],
  page: 3,
};

const searchState = {
  page: 2,
};

const defaultProps = {
  searchResults,
  searchState,
  isSearchStalled: false,
  enterpriseId: 'foo',
  enterpriseSlug: 'fancyCompany',
};

const refinementsFromQueryParams = {};

// eslint-disable-next-line react/prop-types
const CourseSearchWrapper = ({ value = { refinementsFromQueryParams }, props = defaultProps }) => (
  <Provider store={mockStore()}>
    <SearchContext.Provider value={value}>
      <BulkEnrollContextProvider>
        <BaseCourseSearchResults
          {...props}
        />
      </BulkEnrollContextProvider>
    </SearchContext.Provider>
  </Provider>
);

describe('<EnrollButton />', () => {
  const row = { toggleRowSelected: jest.fn() };

  beforeEach(() => {
    row.toggleRowSelected.mockClear();
  });
  it('displays a button', () => {
    const wrapper = mount(<EnrollButton row={row} setStepperOpen={() => {}} />);
    expect(wrapper.find(Button)).toHaveLength(1);
    expect(wrapper.text()).toContain(ENROLL_TEXT);
  });
  it('opens the modal', () => {
    const openSpy = jest.fn();
    const wrapper = mount(<EnrollButton row={row} setStepperOpen={openSpy} />);
    const button = wrapper.find(Button);
    button.simulate('click');
    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy).toHaveBeenCalledWith(true);
  });
  it('toggles the row to be selected', () => {
    const wrapper = mount(<EnrollButton row={row} />);
    const button = wrapper.find(Button);
    button.simulate('click');
    expect(row.toggleRowSelected).toHaveBeenCalledTimes(1);
    expect(row.toggleRowSelected).toHaveBeenCalledWith(true);
  });
});

describe('<CourseSearchResults />', () => {
  it('renders search results', () => {
    const wrapper = mount(<CourseSearchWrapper />);

    // Four header columns, one for sorting, one for Course Name, one for Course Run, one for the enroll column
    const tableHeaderCells = wrapper.find('TableHeaderCell');
    expect(tableHeaderCells.length).toBe(4);
    expect(tableHeaderCells.at(1).prop('Header')).toBe(TABLE_HEADERS.courseName);
    expect(tableHeaderCells.at(2).prop('Header')).toBe(TABLE_HEADERS.courseStartDate);
    expect(tableHeaderCells.at(3).prop('Header')).toBe('');

    // Three table cells, one for sorting, one title, one course run
    const tableCells = wrapper.find('TableCell');
    expect(tableCells.length).toBe(4);
    expect(tableCells.at(1).text()).toBe(testCourseName);
    expect(tableCells.at(2).text()).toBe('Sep 10, 2020');
    expect(tableCells.at(3).find(EnrollButton)).toHaveLength(1);
  });
  it('displays search pagination', () => {
    const wrapper = mount(<CourseSearchWrapper />);
    expect(wrapper.text()).toContain('PAGINATE ME');
  });
  it('hides the stepper by default', () => {
    const wrapper = mount(<CourseSearchWrapper />);
    const stepper = wrapper.find(BulkEnrollmentStepper);
    expect(stepper.props().isOpen).toBe(false);
  });
  it('displays stepper on enroll button click', () => {
    const wrapper = mount(<CourseSearchWrapper />);
    const enrollButton = wrapper.find(EnrollButton);
    act(() => {
      enrollButton.simulate('click');
    });
    wrapper.update();
    const stepper = wrapper.find(BulkEnrollmentStepper);
    expect(stepper.props().isOpen).toBe(true);
  });
  it.skip('displays a toast on success', () => {
    const wrapper = mount(<CourseSearchWrapper />);

    const bulkEnrollmentModal = wrapper.find('BulkEnrollmentModal');
    act(() => {
      bulkEnrollmentModal.props().onSuccess();
    });
    wrapper.update();
    const toast = wrapper.find('Toast');
    // Use the first toast found as it creates a child Toast as well
    expect(toast.at(1).prop('show')).toBe(true);
  });
  it('returns an error message if there\'s an error', () => {
    const errorMsg = 'It did not work';
    const wrapper = mount(<CourseSearchWrapper props={{ ...defaultProps, error: { message: errorMsg } }} />);
    expect(wrapper.text()).toContain(errorMsg);
  });
  it('renders a loading state when loading algolia results', () => {
    const wrapper = mount(<CourseSearchWrapper props={{ ...defaultProps, isSearchStalled: true }} />);
    expect(wrapper.find(Skeleton)).toHaveLength(1);
  });
  it('renders a message when there are no results', () => {
    const wrapper = mount(<CourseSearchWrapper
      props={{ ...defaultProps, searchResults: { ...searchResults, nbHits: 0 } }}
    />);
    expect(wrapper.find(StatusAlert)).toHaveLength(1);
    expect(wrapper.text()).toContain(NO_DATA_MESSAGE);
  });
});
