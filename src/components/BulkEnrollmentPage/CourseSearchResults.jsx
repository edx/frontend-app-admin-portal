import React, {
  useContext,
  useMemo, useState,
} from 'react';
import PropTypes from 'prop-types';
import { connectStateResults } from 'react-instantsearch-dom';
import Skeleton from 'react-loading-skeleton';
import {
  DataTable, /* Toast, */ Button, DataTableContext,
} from '@edx/paragon';
import { SearchContext, SearchPagination } from '@edx/frontend-enterprise';

import BulkEnrollmentStepper from './stepper/BulkEnrollmentStepper';
import StatusAlert from '../StatusAlert';
import { CourseNameCell, FormattedDateCell } from './CourseSearchResultsCells';
import { BulkEnrollContext } from './BulkEnrollmentContext';
import { setExportedTableInstance } from './hooks';
import { convertToSelectedRowsObject } from './helpers';

const ERROR_MESSAGE = 'An error occured while retrieving data';
export const NO_DATA_MESSAGE = 'There are no course results';
export const ENROLL_TEXT = 'Enroll learners';
export const TABLE_HEADERS = {
  courseName: 'Course name',
  courseStartDate: 'Course start date',
  enroll: '',
};

export const EnrollButton = ({ row, setStepperOpen }) => {
  const handleClick = () => {
    // our context depends on the row being selected, so set it to selected before opening the stepper
    row.toggleRowSelected(true);
    setStepperOpen(true);
  };

  return (
    <Button
      className="enroll-button"
      variant="link"
      onClick={handleClick}
    >
      {ENROLL_TEXT}
    </Button>
  );
};

const ExportDataTableContext = () => {
  const { courses: [, coursesDispatch] } = useContext(BulkEnrollContext);
  setExportedTableInstance({ dispatch: coursesDispatch });
  return null;
};

EnrollButton.propTypes = {
  row: PropTypes.shape({
    toggleRowSelected: PropTypes.func.isRequired,
  }).isRequired,
  setStepperOpen: PropTypes.func.isRequired,
};

export const BaseCourseSearchResults = ({
  enterpriseId,
  searchResults,
  // algolia recommends this prop instead of searching
  isSearchStalled,
  searchState,
  error,
  enterpriseSlug,
  subscriptionUUID,
}) => {
  const { refinementsFromQueryParams } = useContext(SearchContext);

  const columns = useMemo(() => [
    {
      Header: TABLE_HEADERS.courseName,
      accessor: 'title',
      // eslint-disable-next-line react/prop-types
      Cell: ({ value, row }) => <CourseNameCell value={value} row={row} enterpriseSlug={enterpriseSlug} />,
    },
    {
      Header: TABLE_HEADERS.courseStartDate,
      accessor: 'advertised_course_run.start',
      Cell: FormattedDateCell,
    },
  ], []);

  const page = useMemo(
    () => {
      if (refinementsFromQueryParams.page) {
        return refinementsFromQueryParams.page;
      }
      return searchState && searchState.page;
    },
    [searchState?.page, refinementsFromQueryParams],
  );

  const [stepperOpen, setStepperOpen] = useState(false);
  // const [showToast, setShowToast] = useState(false);
  const { courses: [selectedCourses] } = useContext(BulkEnrollContext);

  const handleBulkEnrollClick = useMemo(() => () => {
    setStepperOpen(true);
  }, [setStepperOpen]);

  if (isSearchStalled) {
    return (
      <>
        <div className="sr-only">Loading...</div>
        <Skeleton className="mt-3" height={50} count={25} />
      </>
    );
  }

  if (!isSearchStalled && error) {
    return (
      <StatusAlert
        alertType="danger"
        iconClassName="fa fa-times-circle"
        message={`${ERROR_MESSAGE} ${error.message}`}
      />
    );
  }
  if (!isSearchStalled && searchResults?.nbHits === 0) {
    return (
      <StatusAlert
        alertType="warning"
        iconClassName="fa fa-exclamation-circle"
        message={NO_DATA_MESSAGE}
      />
    );
  }
  console.log('SELECTED COURSES', selectedCourses)
  return (
    <>
      <BulkEnrollmentStepper
        isOpen={stepperOpen}
        close={() => setStepperOpen(false)}
        subscriptionUUID={subscriptionUUID}
        enterpriseId={enterpriseId}
      />
      {/* TODO: Update toast when stepper is complete to show the enrollment message.
        And/or use the existing toast framework */}
      {/* <Toast
        onClose={() => setShowToast(false)}
        show={showToast}
      >
        {`${enrolledLearners} learners have been enrolled.`}
      </Toast> */}
      <DataTable
        columns={columns}
        data={searchResults?.hits || []}
        itemCount={searchResults?.nbHits}
        isSelectable
        pageCount={searchResults?.nbPages || 1}
        pageSize={searchResults?.hitsPerPage || 0}
        bulkActions={[{
          buttonText: ENROLL_TEXT,
          handleClick: handleBulkEnrollClick,
        }]}
        initialState={{ selectedRowIds: convertToSelectedRowsObject(selectedCourses) }}
        initialTableOptions={{
          getRowId: (row) => row.key,
        }}
        additionalColumns={[
          {
            id: 'enroll',
            Header: TABLE_HEADERS.enroll,
            // eslint-disable-next-line react/prop-types
            Cell: ({ row }) => (
              <EnrollButton
                row={row}
                setStepperOpen={setStepperOpen}
              />
            ),
          },
        ]}
      >
        <ExportDataTableContext />
        <DataTable.TableControlBar />
        <DataTable.Table />
        <DataTable.TableFooter>
          <DataTable.RowStatus />
          <SearchPagination defaultRefinement={page} />
        </DataTable.TableFooter>
      </DataTable>
    </>
  );
};

BaseCourseSearchResults.defaultProps = {
  searchResults: { nbHits: 0, hits: [] },
  enterpriseId: '',
  error: null,
};

BaseCourseSearchResults.propTypes = {
  // from Algolia
  searchResults: PropTypes.shape({
    nbHits: PropTypes.number,
    hits: PropTypes.arrayOf(PropTypes.shape({})),
    nbPages: PropTypes.number,
    hitsPerPage: PropTypes.number,
    page: PropTypes.number,
  }),
  isSearchStalled: PropTypes.bool.isRequired,
  error: PropTypes.shape({
    message: PropTypes.string,
  }),
  searchState: PropTypes.shape({
    page: PropTypes.number,
  }).isRequired,
  // from parent
  enterpriseId: PropTypes.string,
  enterpriseSlug: PropTypes.string.isRequired,
  subscriptionUUID: PropTypes.string.isRequired,
};

export default connectStateResults(BaseCourseSearchResults);
