/* eslint-disable import/no-extraneous-dependencies */
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({ adapter: new Adapter() });


// TODO: Once there are no more console errors in tests, uncomment the code below
// const { error } = global.console;

// global.console.error = (...args) => {
//   error(...args);
//   throw new Error(args.join(' '));
// };


// These configuration values are usually set in webpack's EnvironmentPlugin however
// Jest does not use webpack so we need to set these so for testing
process.env.LMS_BASE_URL = 'http://localhost:18000';
process.env.DATA_API_BASE_URL = 'http://localhost:8000';
process.env.ECOMMERCE_BASE_URL = 'http://localhost:8000';
process.env.LICENSE_MANAGER_BASE_URL = 'http://localhost:18170';
process.env.FEATURE_FLAGS = {};
process.env.ENTERPRISE_LEARNER_PORTAL_URL = 'http://localhost:8734';
