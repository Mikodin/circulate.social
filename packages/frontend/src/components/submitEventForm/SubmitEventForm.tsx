import { useState, useContext, Fragment, useReducer } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import UserContext from '../../state-management/UserContext';
import css from './submitEventForm.module.scss';

const SUBMIT_EVENT_ENDPOINT =
  'https://z3edrz53yg.execute-api.us-east-1.amazonaws.com/dev/events/create';

interface Props {
  seedCircleId?: string;
}

const SubmitEventForm = (props) => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const { jwtToken } = useContext(UserContext);
  const { seedCircleId } = props;

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const createResponse = await axios.post(
        SUBMIT_EVENT_ENDPOINT,
        {
          name,
          description,
          circleId: seedCircleId,
        },
        { headers: { Authorization: jwtToken } }
      );

      const newEvent = createResponse.data.event;
      router.push(`/circles/${seedCircleId}`);
      return newEvent;
    } catch (e) {
      alert(e);
    }
  }

  return (
    <Fragment>
      <form className={css.container} onSubmit={(e) => handleSubmit(e)}>
        <label>
          <b>Name</b>
        </label>
        <input
          type="text"
          placeholder="Some Event"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label>
          <b>Description</b>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <label>
          <b>Allow this Event to be discoverable?</b>
        </label>
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
        />

        <button type="submit">Submit Event</button>
      </form>
    </Fragment>
  );
};

export default SubmitEventForm;
