/* eslint-disable no-unused-vars */
/*
 * <license header>
 */

import React from 'react';
import { Text } from '@adobe/react-spectrum';
import { register } from '@adobe/uix-guest';
import { extensionId } from './Constants';

function ExtensionRegistration() {
  const init = async () => {
    const guestConnection = await register({
      id: extensionId,
      methods: {
        detailSidePanel: {
          getPanels() {
            // YOUR SIDE PANELS CODE SHOULD BE HERE
            return [
              {
                'id': 'link-with-workfront',
                'tooltip': 'Link with Workfront Project',
                'icon': 'LinkPage',
                'title': 'Quick Link',
                'contentUrl': '/#link-with-workfront',
                'reloadOnThemeChange': 'true',
              },
            ];
          },
        },
      },
    });
  };
  init().catch(console.error);

  return <Text>IFrame for integration with Host (AEM Assets View)...</Text>;
}

export default ExtensionRegistration;
