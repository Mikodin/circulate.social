import { useState, Fragment } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import {
  Form,
  Input,
  Button,
  Alert,
  Radio,
  Select,
  Popover,
  Tabs,
  Card,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

import { API_ENDPOINT } from '../../util/constants';
import styles from './StartCircleForm.module.scss';

export const CREATE_CIRCLE_ENDPOINT = `${API_ENDPOINT}/circles/create`;

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
      router.push(`/submit-content?circleId=${circle.id}`);
    } catch (error) {
      console.error(error);
      setIsCreateCircleInFlight(false);
      setIsCreateCircleError(true);
    }
  };

  const renderDescriptionPiece = () => {
    return (
      <Card
        title="Description examples"
        className={styles.descriptionExampleCard}
        extra={
          <Button onClick={() => setShowDescriptionPopover(false)}>
            Close
          </Button>
        }
      >
        <p>Give your Circle a clear description.</p>
        <p>Include things like:</p>
        <p>
          What sorts of content would you like to see? Who is this for? Is it
          only for a certain area?
        </p>
        <p>Here are some examples of good descriptions</p>
        <Tabs defaultActiveKey="1" style={{ maxWidth: 'fit-content' }}>
          <TabPane tab="Bali’s Best" key="1">
            <p>For those living in Bali.</p>{' '}
            <p>
              Post fun things to do and useful resources relating to Bali.
              Things like parties, events, group trips, workshops, doctors and
              chefs.
            </p>
            <p>
              Don’t post housing, products, online events, books or self
              promotion.
            </p>
          </TabPane>
          <TabPane tab="Deep House Playlists" key="2">
            <p>
              For the lovers of Deep House music. Post links to your favorite
              Soundcloud and Spotify playlists.
            </p>
            <p>Please don’t post any other genres</p>
          </TabPane>
          <TabPane tab="Online Wellness Classes" key="3">
            <p>
              Post your favorite free online yoga, workouts, mediation and
              wellness classes.
            </p>
          </TabPane>
          <TabPane tab="Joe’s friends Group" key="4">
            <p>
              Post any recommendations on events, books, movies, podcasts,
              articles or anything else you think our friends will be interested
              in.
            </p>
            <p>Don’t post any porn or recipes.</p>
          </TabPane>
          <TabPane tab="Fortnite hacks" key="5">
            <p>Post any hacks, tips, tricks or walk throughs for Fortnite.</p>
          </TabPane>
          <TabPane tab="Alternative Medicine for Parkinson’s" key="6">
            <p>Post articles, scientific studies or homeopathic treatments.</p>
          </TabPane>
          <TabPane tab="Best Photography Accounts" key="7">
            <p>Post your favorite Photography Instagram Accounts.</p>
            <p>Don’t post more than 3 a day.</p>
          </TabPane>
          <TabPane tab="Best Vegan Recipes" key="8">
            <p>Post links to your favorite vegan recipes.</p>
            <p>Don’t post more than 2 a day.</p>
          </TabPane>
        </Tabs>
      </Card>
    );
  };

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
        className={styles.form}
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
          label={<span>Circle description</span>}
        >
          <Input.TextArea
            rows={3}
            placeholder="Circle description"
            onFocus={(): void => setShowDescriptionPopover(true)}
            onBlur={(): void => setShowDescriptionPopover(false)}
            style={{ fontSize: '16px' }}
          />
        </Form.Item>
        {showDescriptionPopover && <div>{renderDescriptionPiece()}</div>}
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
              className={styles.verticalRadioButton}
              value="private"
              // @ts-expect-error
              onFocus={(): void => setShowPrivacyPopover(true)}
            >
              Private
            </Radio>
            <Radio
              className={styles.verticalRadioButton}
              value="public"
              // @ts-expect-error
              onFocus={(): void => setShowPrivacyPopover(true)}
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
