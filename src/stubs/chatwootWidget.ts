import React from 'react';

export const ChatWootWidget = (props: any) => {
  React.useEffect(() => {
    if (props?.isModalVisible && props?.closeModal) {
      props.closeModal();
    }
  }, []);
  return null;
};

export default ChatWootWidget;
