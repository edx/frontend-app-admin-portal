import { connect } from 'react-redux';

import CodeAssignmentModal from '../../components/CodeAssignmentModal';

import sendCodeAssignment from '../../data/actions/codeAssignment';

const mapDispatchToProps = dispatch => ({
  sendCodeAssignment: options => new Promise((resolve, reject) => {
    dispatch(sendCodeAssignment({
      options,
      onSuccess: (response) => { resolve(response); },
      onError: (error) => { reject(error); },
    }));
  }),
});

export default connect(null, mapDispatchToProps)(CodeAssignmentModal);
