import * as cx from 'classnames';
import AddIcon from 'material-ui-icons/Add';
import RemoveIcon from 'material-ui-icons/Delete';
import Button from 'material-ui/Button';
import IconButton from 'material-ui/IconButton';
import Paper from 'material-ui/Paper';
import { CircularProgress } from 'material-ui/Progress';
import TextField from 'material-ui/TextField';
import Typography from 'material-ui/Typography';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { SuggestedContact } from '../../common/models/contacts';
import Progress from '../components/progress';
import { State } from '../state';

import {
  addContact,
  changeContactLookup,
  removeContact,
  userLookup,
} from '../actions';

import List, {
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
} from 'material-ui/List';

const styles = require('./contacts.css');

interface SuggestedContactWithApi extends SuggestedContact {
  pendingAdd: boolean;
}

interface SlimContact {
  name: string;
  id: string;
  pendingDelete: boolean;
}

interface Props {
  addContactEnabled: boolean;
  contacts: SlimContact[];
  loading: boolean;
  lookup: string;
  lookupId?: string;
  onAddContact: (lookupId: string) => void;
  onRemoveContact: (lookupId: string) => void;
  onLookupChange: (lookup: string) => void;
  suggestedContacts: SuggestedContact[];
}

const ContactsComponent = ({
    addContactEnabled, contacts, lookup, lookupId, onAddContact, onLookupChange,
    onRemoveContact, loading, suggestedContacts,
  }: Props) => {
  const contactListItem = ({name, id, pendingDelete}: SlimContact) => {
    const action = pendingDelete ? (<CircularProgress color='accent' />) : (
      <IconButton onClick={() => onRemoveContact(id)}>
        <RemoveIcon />
      </IconButton>
    );
    return (
      <ListItem key={id}>
        <ListItemText primary={name} />
        <ListItemSecondaryAction>
          {action}
        </ListItemSecondaryAction>
      </ListItem>
    );
  };
  const suggestedContactListItem = ({
      id, display_name, added_current_user, common_contacts,
      pendingAdd}: SuggestedContactWithApi) => {
    const addedYou = (
      <div>
        <Typography color='accent'>
          Added you!
        </Typography>
      </div>
    );
    const commonContacts = (
      <div>
      {common_contacts} friends in common
      </div>
    );
    const subText = (
      <div style={{display: 'flex', flexDirection: 'column'}}>
        {added_current_user ? addedYou : undefined}
        {common_contacts ? commonContacts : undefined}
      </div>
    );
    const action = pendingAdd ? (<CircularProgress color='accent' />) : (
      <IconButton onClick={() => onAddContact(id)}>
        <AddIcon />
      </IconButton>
    );
    return (
      <ListItem key={id}>
        <ListItemText primary={display_name} secondary={subText} />
        <ListItemSecondaryAction>
          {action}
        </ListItemSecondaryAction>
      </ListItem>
    );
  };
  const contactList = contacts.length === 0 ?
      (
        <Typography align='center' style={{margin: '16px'}}>
          No buds. Add contacts by searching above.
        </Typography>
      ) :
      (
        <Paper style={{marginTop: '16px'}}>
          <List>
            {contacts.map(contactListItem)}
          </List>
        </Paper>
      );
  const suggestedList = (
    <Paper style={{marginTop: '16px'}}>
      <List>
        {suggestedContacts.map(suggestedContactListItem)}
      </List>
    </Paper>
  );
  return (
    <div>
      <Progress visible={loading} />
      <div className={cx(styles.container, styles.contacts)}>
        <Paper style={{display: 'flex', flexDirection: 'row'}}>
          <TextField
              onChange={(event) => onLookupChange(event.target.value)}
              label='Lookup contact'
              value={lookup}
              fullWidth={true}
          />
          <Button
              onClick={() => lookupId ? onAddContact(lookupId) : null}
              disabled={!addContactEnabled}
              raised={true}
              color='accent'
          >
            <AddIcon />
          </Button>
        </Paper>
      </div>
      <div className={styles.listContainerParent}>
        <div className={styles.listContainer}>
          <Typography
              type='subheading'
              align='center'
              style={{marginTop: '16px'}}
          >
            People you may know
          </Typography>
          {suggestedList}
        </div>
        <div className={cx(styles.listContainer)}>
          <Typography
              type='subheading'
              align='center'
              style={{marginTop: '16px'}}
          >
            Your Contacts
          </Typography>
          {contactList}
        </div>
      </div>
    </div>
  );
};

const compareByDisplayName =
    (a: SlimContact, b: SlimContact) => a.name.localeCompare(b.name);

const compareByAddedAndCommon = (a: SuggestedContact, b: SuggestedContact) => {
  if (a.added_current_user && !b.added_current_user) {
    return -1;
  }
  if (b.added_current_user && !a.added_current_user) {
    return 1;
  }
  return (b.common_contacts === a.common_contacts) ?
      a.display_name.localeCompare(b.display_name) :
      b.common_contacts - a.common_contacts;
};

const mapStateToProps = (state: State) => ({
  addContactEnabled: !!state.entities.users[state.ui.contacts.lookup],
  contacts: Object.keys(state.entities.contacts)
      .map((i) => ({
        id: i,
        name: state.entities.contacts[i].display_name,
        pendingDelete: state.apiStatus.pendingContactDeletes[i],
      }))
      .sort(compareByDisplayName),
  loading: state.apiStatus.inProgress.GET_CONTACTS,
  lookup: state.ui.contacts.lookup,
  lookupId: state.entities.users[state.ui.contacts.lookup],
  suggestedContacts: Object.keys(state.entities.suggestedContacts)
      .map((i) => ({
        ...state.entities.suggestedContacts[i],
        pendingAdd: state.apiStatus.pendingContactAdds[i],
      }))
      .sort(compareByAddedAndCommon),
});

const mapDispatchToProps = (dispatch: Dispatch<State>) => ({
  onAddContact: (lookupId: string) => {
    dispatch(addContact(lookupId));
    dispatch(changeContactLookup(''));
  },
  onLookupChange: (lookup: string) => {
    dispatch(changeContactLookup(lookup));
    dispatch(userLookup(lookup));
  },
  onRemoveContact: (lookupId: string) => {
    dispatch(removeContact(lookupId));
  },
});

const Contacts =
    connect(mapStateToProps, mapDispatchToProps)(ContactsComponent);

export default Contacts;
