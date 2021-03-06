import * as cx from 'classnames';
import AddIcon from 'material-ui-icons/Add';
import Button from 'material-ui/Button';
import Paper from 'material-ui/Paper';
import TextField from 'material-ui/TextField';
import Typography from 'material-ui/Typography';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { updateAccount, updateEmail } from '../actions';
import { State } from '../state';

const styles = require('./account-email.css');

interface Props {
  email: string;
  onEmailUpdate: (email: string) => void;
  onEmailSubmit: (email: string) => void;
  sendInProgress: boolean;
}

export default (
    {email, onEmailUpdate, onEmailSubmit, sendInProgress}: Props) => {
  return (
    <div className={cx(styles.container, styles.email)}>
      <Paper className={styles.paper}>
          <Typography type='title' className={styles.title}>
            Email Notifications
          </Typography>
          <Typography type='caption' className={styles.caption}>
            Providing an email address is optional and allows pifuxelck to
            notify you when it is your turn a game an when a game you are a
            participant in finishes.
          </Typography>
          <TextField
              className={styles.text}
              disabled={sendInProgress}
              onChange={(event) => onEmailUpdate(event.target.value)}
              onSubmit={() => onEmailSubmit(email)}
              label='Email'
              value={email}
              fullWidth={true}
          />
          <div className={styles.buttonContainer}>
            <Button
                disabled={sendInProgress}
                onClick={() => onEmailSubmit(email)}
                raised={true}
                color='accent'
                className={styles.button}
            >
              Update
            </Button>
          </div>
      </Paper>
    </div>
  );
};
