import React from 'react';

type MenuComponent = React.ComponentType<any>;

const passthrough = (props: any) => React.createElement(React.Fragment, null, props?.children ?? null);
const noopComponent = (props: any) => React.createElement(React.Fragment, null, props?.children ?? null);
const emptyComponent = () => null;

export const create = (component: MenuComponent, _type?: string) => component;
export const Root = passthrough;
export const Trigger = passthrough;
export const Content = noopComponent;
export const Item = passthrough;
export const ItemTitle = passthrough;
export const ItemSubtitle = passthrough;
export const ItemIcon = passthrough;
export const ItemImage = passthrough;
export const Separator = emptyComponent;
export const Label = passthrough;
export const Preview = passthrough;
export const PreviewFrame = passthrough;
export const Group = passthrough;
export const Arrow = emptyComponent;
export const PortalHost = passthrough;

const DropdownMenu = {
  create,
  Root,
  Trigger,
  Content,
  Item,
  ItemTitle,
  ItemSubtitle,
  ItemIcon,
  ItemImage,
  Separator,
  Label,
  Preview,
  PreviewFrame,
  Group,
  Arrow,
  PortalHost,
};

export default DropdownMenu;
