import { useState, Fragment } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { Form, Input, Button, Alert, Radio, Select, Popover, Tabs } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

import css from './StartCircleForm.module.scss';

export const CREATE_CIRCLE_ENDPOINT =
  'https://z3edrz53yg.execute-api.us-east-1.amazonaws.com/dev/circles/create';

export interface Props {
  jwtToken: string;
}

const StartCircleForm = (props: Props): JSX.Element => {
  const router = useRouter();
  const [form] = Form.useForm();

  const [isCreateCircleInFlight, setIsCreateCircleInFlight] = useState(false);
  const [isCreateCircleError, setIsCreateCircleError] = useState(false);
  const [showDescriptionPopover, setShowDescriptionPopover] = useState(false);
  const [showFrequencyPopover, setShowFrequencyPopover] = useState(false);
  const [showPrivacyPopover, setShowPrivacyPopover] = useState(false);

  const { jwtToken } = props;

  interface FormValues {
    name: string;
    description: string;
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    privacy: 'private' | 'public';
  }

  const onFinish = async (formValues: FormValues): Promise<void> => {
    try {
      setIsCreateCircleInFlight(true);
      const createResponse = await axios.post(
        CREATE_CIRCLE_ENDPOINT,
        {
          ...formValues,
        },
        { headers: { Authorization: jwtToken } }
      );
      setIsCreateCircleInFlight(false);
      setIsCreateCircleError(false);
      const { circle } = createResponse.data;
      router.push(`/circles/[circleId]`, `/circles/${circle.id}`);
    } catch (error) {
      console.error(error);
      setIsCreateCircleInFlight(false);
      setIsCreateCircleError(true);
    }
  };

  // TODO have it popup on input focus
  const renderDescriptionPopover = (): JSX.Element => (
    <Popover
      title="Define your Circle"
      content={
        <div>
          <span>
            Descriptions are important. They help shape the community.
          </span>
          <br />
          <span>
            So are boundaries - they help to create a safe container for all.
          </span>
          <br />
          <span>
            We will surface this description to newcomers as they are joining
            the Circle. So define what you want and don't want.
          </span>
          <br />
          <span>
            What sorts of content would you <strong>like</strong> to see?
          </span>
          <br />
          <span>
            What sorts of content would you <strong>not</strong> like to see?
          </span>
          <br />
          <span>Who is this for? Who is this not for?</span>
          <br />
          <span>Get clear - be specific - check out the examples below!</span>
          <br />
          <Tabs defaultActiveKey="1" style={{ maxWidth: 'fit-content' }}>
            <TabPane tab="Example 1" key="1">
              Some good example of a description
            </TabPane>
            <TabPane tab="Example 2" key="2">
              Another good example of a description
            </TabPane>
            <TabPane tab="Example 3" key="3">
              Yet another good example of a description
            </TabPane>
          </Tabs>
        </div>
      }
      trigger="click"
      onVisibleChange={(): void =>
        setShowDescriptionPopover(!showDescriptionPopover)
      }
      visible={showDescriptionPopover}
    >
      <InfoCircleOutlined
        onClick={(): void => setShowDescriptionPopover(!showDescriptionPopover)}
      />
    </Popover>
  );
  const renderFrequencyPopover = (): JSX.Element => (
    <Popover
      title="Newsletters only go out when there is content"
      content={
        <div>
          <span>Daily: Once a day</span>
          <br />
          <span>Weekly: Once a week</span>
          <br />
          <span>Bi-Weekly: Every other week</span>
          <br />
          <span>Monthly: Once per month</span>
        </div>
      }
      trigger="click"
      onVisibleChange={(): void =>
        setShowFrequencyPopover(!showFrequencyPopover)
      }
      visible={showFrequencyPopover}
    >
      <InfoCircleOutlined
        onClick={(): void => setShowFrequencyPopover(!showFrequencyPopover)}
      />
    </Popover>
  );

  const renderPrivacyPopover = (): JSX.Element => (
    <Popover
      title="On Circle privacy"
      content={
        <div>
          <span>
            At the moment there is no public way of discovering a Circle without
            being invited.
          </span>
          <br />
          <span>
            We are planning to create a public facing Circle discovery feed.
          </span>
          <br />
          <span>
            If your Circle is &quot;public&quot; it will be surfaced in that
            discovery feed.
          </span>
        </div>
      }
      trigger="click"
      onVisibleChange={(): void => setShowPrivacyPopover(!showPrivacyPopover)}
      visible={showPrivacyPopover}
    >
      <InfoCircleOutlined
        onClick={(): void => setShowPrivacyPopover(!showPrivacyPopover)}
      />
    </Popover>
  );
  const { TabPane } = Tabs;
  return (
    <Fragment>
      <Form
        className={css.form}
        form={form}
        name="horizontal_login"
        size="large"
        layout="vertical"
        onFinish={onFinish}
        initialValues={
          {
            name: '',
            description: '',
            frequency: 'weekly',
            privacy: 'private',
          } as FormValues
        }
        onValuesChange={(): void => {
          setIsCreateCircleError(false);
        }}
      >
        <Form.Item
          name="name"
          rules={[
            { required: true, message: "Please input your Circle's name" },
          ]}
          label="Name of Circle"
        >
          <Input placeholder="Circle name" type="text" />
        </Form.Item>

        <Form.Item
          name="description"
          rules={[
            {
              required: false,
              message: 'Please input a description for your Circle',
            },
          ]}
          label={<span>{renderDescriptionPopover()} Circle description</span>}
        >
          <Input.TextArea
            rows={3}
            placeholder="Circle description"
            onFocus={(): void => setShowDescriptionPopover(true)}
            onBlur={(): void => setShowDescriptionPopover(false)}
            style={{ fontSize: '16px' }}
          />
        </Form.Item>
        <Form.Item
          name="frequency"
          label={<span>{renderFrequencyPopover()} Cirulation frequency</span>}
          hasFeedback
          rules={[
            {
              required: true,
              message:
                'Please select how often you would like us to send your newsletter',
            },
          ]}
        >
          <Select
            placeholder="Please select your Circulation frequency"
            onFocus={(): void => setShowFrequencyPopover(true)}
            onBlur={(): void => setShowFrequencyPopover(false)}
          >
            <Select.Option value="daily">Daily</Select.Option>
            <Select.Option value="weekly">Weekly</Select.Option>
            <Select.Option value="biweekly">Bi-weekly</Select.Option>
            <Select.Option value="monthly">Monthly</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="privacy"
          label={<span>{renderPrivacyPopover()} Circle Privacy</span>}
        >
          <Radio.Group>
            <Radio
              className={css.verticalRadioButton}
              value="private"
              // @ts-expect-error
              onFocus={(): void => setShowPrivacyPopover(true)}
              onBlur={(): void => setShowPrivacyPopover(false)}
            >
              Private
            </Radio>
            <Radio
              className={css.verticalRadioButton}
              value="public"
              // @ts-expect-error
              onFocus={(): void => setShowPrivacyPopover(true)}
              onBlur={(): void => setShowPrivacyPopover(false)}
            >
              Public
            </Radio>
          </Radio.Group>
        </Form.Item>
        {isCreateCircleError && (
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
            const isNameTouched = form.isFieldTouched('name');
            const isFormTouched = isNameTouched;
            return (
              <Button
                data-testid="submitButton"
                loading={isCreateCircleInFlight}
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
                {isCreateCircleInFlight
                  ? 'Creating Circle...'
                  : 'Create Circle'}
              </Button>
            );
          }}
        </Form.Item>
      </Form>
    </Fragment>
  );
};

export default StartCircleForm;
