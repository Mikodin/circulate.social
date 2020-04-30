import { useState, useContext, Fragment, useReducer } from 'react';
import { useRouter } from 'next/router';
import UserContext from '../../state-management/UserContext';
import axios from 'axios';
import css from './startCircleForm.module.scss';

const CREATE_CIRCLE_ENDPOINT =
  'https://z3edrz53yg.execute-api.us-east-1.amazonaws.com/dev/circles/create';

const StartCircleForm = (props) => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const { jwtToken } = useContext(UserContext);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const createResponse = await axios.post(
        CREATE_CIRCLE_ENDPOINT,
        {
          name,
          description,
        },
        { headers: { Authorization: jwtToken } }
      );

      const circle = createResponse.data.circle;
      router.push(`/circles/${circle.id}`);
    } catch (e) {
      alert(e.response.data.message);
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
          placeholder="#notasexparty"
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
          <b>Allow this Circle to be discoverable?</b>
        </label>
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
        />

        <button type="submit">Create Circle</button>
      </form>
    </Fragment>
  );
};

export default StartCircleForm;
