import SendIcon from 'material-ui-icons/Send';
import Card, { CardActions, CardContent, CardMedia } from 'material-ui/Card';
import Divider from 'material-ui/Divider';
import IconButton from 'material-ui/IconButton';
import { CircularProgress } from 'material-ui/Progress';
import TextField from 'material-ui/TextField';
import Typography from 'material-ui/Typography';
import * as React from 'react';
import * as models from '../../common/models/drawing';
import { Turn } from '../../common/models/turn';
import Drawing from '../components/drawing';

interface Props {
  gameId: string;
  drawing: models.Drawing;
  expirationTime: number;
  label: string;
  onChange: (turn: Turn) => void;
  onSubmit: (gameId: string, turn: Turn) => void;
  sendPending: boolean;
}

const InboxDrawingCard = ({
    gameId, label, drawing, onChange, onSubmit, sendPending,
    expirationTime}: Props) => {
  const onChangeCallback =
      (event: React.ChangeEvent<HTMLInputElement>) => onChange({
        is_drawing: false,
        label: event.target.value,
      });
  const onClickCallback = () => onSubmit(gameId, {
    is_drawing: false,
    label,
  });
  const sendButton = (
    <IconButton onClick={onClickCallback}>
      <SendIcon />
    </IconButton>
  );
  const loading = (
    <CircularProgress color='accent' />
  );
  const action = sendPending ? loading : sendButton;
  return (
    <Card style={{margin: '8px'}}>
      <CardContent>
        <Typography type='caption' align='right'>
          Expires at {new Date(expirationTime * 1000).toLocaleString()}
        </Typography>
      </CardContent>
      <Drawing drawing={drawing} />
      <Divider />
      <CardActions>
        <TextField
            onChange={sendPending ? undefined : onChangeCallback}
            label='Description'
            value={label}
            fullWidth={true}
        />
        {action}
      </CardActions>
    </Card>
  );
};

export default InboxDrawingCard;
