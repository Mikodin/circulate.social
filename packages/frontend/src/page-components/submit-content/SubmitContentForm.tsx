import { Fragment, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { Form, Input, Button, Alert } from 'antd';

import css from './SubmitEventForm.module.scss';

export const SUBMIT_EVENT_ENDPOINT =
  'https://z3edrz53yg.execute-api.us-east-1.amazonaws.com/dev/events/create';

export interface Props {
  jwtToken: string;
  seedCircleId?: string;
}

const SubmitContentForm = (props: Props): JSX.Element => {
  const [form] = Form.useForm();
  const router = useRouter();
  const { seedCircleId } = props;

  const [isEventForm, setIsEventForm] = useState(false);
  const [
    isFetchCreateContentInFlight,
    setIsFetchCreateContentInFlight,
  ] = useState(false);

  const [isFetchCreateContentError, setIsFetchCreateContentError] = useState(
    false
  );

  interface FormValues {
    title: string;
    link: string;
    date: string;
    whyShare: string;
    cost: number;
    timezone: string;
  }
  async function onFinish(formValues: FormValues): Promise<void> {
    const { title, whyShare } = formValues;
    try {
      setIsFetchCreateContentInFlight(true);

      await axios.post(
        SUBMIT_EVENT_ENDPOINT,
        {
          name: title,
          description: whyShare,
          circleId: seedCircleId,
        },
        { headers: { Authorization: props.jwtToken } }
      );

      setIsFetchCreateContentInFlight(false);
      setIsFetchCreateContentError(false);
      router.push(`/circles/${seedCircleId}`);

      return;
    } catch (e) {
      console.error(e);
      setIsFetchCreateContentError(true);
    }
  }

  return (
    <Fragment>
      <Form
        className={css.form}
        form={form}
        hideRequiredMark
        name="horizontal_login"
        size="large"
        layout="vertical"
        onFinish={onFinish}
        initialValues={
          {
            title: '',
            link: '',
            date: '',
            whyShare: '',
            cost: 0,
            timezone: '',
          } as FormValues
        }
        onValuesChange={(): void => {
          setIsFetchCreateContentError(false);
          if (form.getFieldValue('date')) {
            setIsEventForm(true);
          } else if (!form.getFieldValue('date')) {
            setIsEventForm(false);
          }
        }}
      >
        <Form.Item
          name="title"
          rules={[{ required: true, message: 'Please give your post a Title' }]}
          label="Title of post"
        >
          <Input placeholder="Title" type="text" />
        </Form.Item>
        <Form.Item name="link" label="Link to content">
          <Input placeholder="Link" type="text" />
        </Form.Item>
        <Form.Item name="date" label="Event date">
          <Input placeholder="Date" type="text" />
        </Form.Item>

        {isEventForm && (
          <>
            <Form.Item name="timezone" label="Timezone">
              <Input placeholder="Timezone" type="text" />
            </Form.Item>
            <Form.Item name="cost" label="Event cost">
              <Input placeholder="Cost" type="text" />
            </Form.Item>
          </>
        )}
        <Form.Item name="whyShare" label="Why are you sharing this?">
          <Input.TextArea
            rows={3}
            placeholder="Why are you sharing this?"
            // onFocus={(): void => setShowDescriptionPopover(true)}
            style={{ fontSize: '16px' }}
          />
        </Form.Item>

        {isFetchCreateContentError && (
          <Alert
            message="Something went wrong, please try again."
            type="error"
            showIcon
            closable
            banner
            style={{ marginBottom: '10px' }}
          />
        )}
        <Form.Item shouldUpdate={true}>
          {(): JSX.Element => {
            const isTitleTouched = form.isFieldTouched('title');
            const isFormTouched = isTitleTouched;
            return (
              <Button
                data-testid="submitButton"
                loading={isFetchCreateContentInFlight}
                type="primary"
                htmlType="submit"
                size="large"
                block
                disabled={Boolean(
                  !isFormTouched ||
                    form.getFieldsError().filter(({ errors }) => errors.length)
                      .length
                )}
              >
                {isFetchCreateContentInFlight ? 'Submitting...' : 'Submit'}
              </Button>
            );
          }}
        </Form.Item>
      </Form>
    </Fragment>
  );
};

export default SubmitContentForm;
