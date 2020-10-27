import { useState } from 'react';
import { Modal, List } from 'antd';
import { UserOutlined } from '@ant-design/icons';

export interface Props {
  circleMemberNames: string[];
  renderComponent?: JSX.Element;
}

const CircleMembers = ({
  circleMemberNames,
  renderComponent,
}: Props): JSX.Element => {
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  return (
    <>
      <div onClick={() => setIsMembersModalOpen(true)}>
        {renderComponent || (
          <h4 role="button">
            <a>Members: {circleMemberNames.length}</a>
          </h4>
        )}
      </div>
      <Modal
        width={300}
        title="Members in Circle"
        visible={isMembersModalOpen}
        onOk={() => setIsMembersModalOpen(false)}
        onCancel={() => setIsMembersModalOpen(false)}
      >
        <List
          dataSource={circleMemberNames}
          renderItem={(memberName) => (
            <List.Item>
              <UserOutlined /> {memberName}
            </List.Item>
          )}
        />
      </Modal>
    </>
  );
};

export default CircleMembers;
