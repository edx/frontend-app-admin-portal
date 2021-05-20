import React from 'react';
import PropTypes from 'prop-types';
import algoliasearch from 'algoliasearch/lite';
import { InstantSearch, Configure } from 'react-instantsearch-dom';
import { SearchData, SearchHeader } from '@edx/frontend-enterprise';

import { configuration } from '../../../config';
import { ADD_COURSES_TITLE } from './constants';

import CourseSearchResults from '../CourseSearchResults';

const searchClient = algoliasearch(
  configuration.ALGOLIA.APP_ID,
  configuration.ALGOLIA.SEARCH_API_KEY,
);

const AddCoursesStep = ({
  goToNextStep, enterpriseId, enterpriseSlug, subscription,
}) => (
  <>
    <p>Find courses in your subscription catalog that matter most for your learners.</p>
    <h2>{ADD_COURSES_TITLE}</h2>
    <SearchData>
      <InstantSearch
        indexName={configuration.ALGOLIA.INDEX_NAME}
        searchClient={searchClient}
      >
        <Configure
          filters={`enterprise_catalog_uuids:${subscription.enterpriseCatalogUuid}`}
          hitsPerPage={25}
        />
        <SearchHeader variant="default" />
        <CourseSearchResults
          enterpriseId={enterpriseId}
          enterpriseSlug={enterpriseSlug}
          subscriptionUUID={subscription.uuid}
          goToNextStep={goToNextStep}
        />
      </InstantSearch>
    </SearchData>
  </>
);

AddCoursesStep.propTypes = {
  goToNextStep: PropTypes.func.isRequired,
  enterpriseId: PropTypes.string.isRequired,
  enterpriseSlug: PropTypes.string.isRequired,
  subscription: PropTypes.shape({
    uuid: PropTypes.string.isRequired,
    enterpriseCatalogUuid: PropTypes.string.isRequired,
  }).isRequired,
};

export default AddCoursesStep;
