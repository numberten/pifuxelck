import * as cx from 'classnames';
import AddIcon from 'material-ui-icons/Add';
import Button from 'material-ui/Button';
import Paper from 'material-ui/Paper';
import TextField from 'material-ui/TextField';
import Typography from 'material-ui/Typography';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import AccountEmail from '../components/account-email';
import AccountPassword from '../components/account-password';
import Progress from '../components/progress';
import { State } from '../state';

import {
  setAccountPasswordError,
  updateAccount,
  updateEmail,
  updatePassword,
  updatePasswordConfirmation,
} from '../actions';

interface Props {
  email: string;
  loading: boolean;
  onEmailSubmit: (email: string) => void;
  onEmailUpdate: (email: string) => void;
  onPasswordConfirmationUpdate: (passwordConfirmation: string) => void;
  onPasswordSubmit: (password: string, passwordConfirmation: string) => void;
  onPasswordUpdate: (password: string) => void;
  password: string;
  passwordConfirmation: string;
  passwordError: string;
  sendInProgress: boolean;
}

const AccountComponent = (props: Props) => {
  return (
    <div>
      <Progress visible={props.loading} />
      <AccountEmail {...props} />
      <AccountPassword {...props} />
    </div>
  );
};

const firstNonNull = (list: any[]) => {
  for (const i in list) {
    if (list[i] !== null) {
      return list[i];
    }
  }
  return null;
};

const mapStateToProps = (state: State) => ({
  email:
      firstNonNull([state.ui.account.email, state.entities.account.email, '']),
  loading: state.apiStatus.inProgress.GET_ACCOUNT,
  password: state.ui.account.password || '',
  passwordConfirmation: state.ui.account.passwordConfirmation || '',
  passwordError: state.ui.account.passwordError || '',
  sendInProgress: state.apiStatus.inProgress.UPDATE_ACCOUNT,
});

const mapDispatchToProps = (dispatch: Dispatch<State>) => ({
  onEmailSubmit: (email: string) => dispatch(updateAccount({email})),
  onEmailUpdate: (email: string) => dispatch(updateEmail(email)),
  onPasswordConfirmationUpdate: (passwordConfirmation: string) => {
    dispatch(setAccountPasswordError(''));
    dispatch(updatePasswordConfirmation(passwordConfirmation));
  },
  onPasswordSubmit: (password: string, passwordConfirmation: string) => {
    if (password !== passwordConfirmation) {
      dispatch(setAccountPasswordError('Passwords do not match.'));
    } else {
      dispatch(setAccountPasswordError(''));
      dispatch(updateAccount({password}));
    }
  },
  onPasswordUpdate: (password: string) => {
    dispatch(setAccountPasswordError(''));
    dispatch(updatePassword(password));
  },
});

const Account =
    connect(mapStateToProps, mapDispatchToProps)(AccountComponent);

export default Account;
