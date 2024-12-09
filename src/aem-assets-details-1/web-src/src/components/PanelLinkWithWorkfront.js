/*
 * <license header>
 */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, act } from 'react';
import { attach } from '@adobe/uix-guest';
import {
  Flex,
  Provider,
  defaultTheme,
  Link,
  Text,
  ButtonGroup,
  Button,
  View,
  ComboBox,
  Item
} from '@adobe/react-spectrum';

import { extensionId } from './Constants';
import fetch from 'node-fetch';
import actionWebInvoke from '../utils';

import actions from '../config.json'

export default function PanelLinkWithWorkfront() {
  // Fields
  const [guestConnection, setGuestConnection] = useState();
  const [colorScheme, setColorScheme] = useState('light');
  const [configuration, setConfiguration] = useState();
  const [IMSInfo, setIMSInfo] = useState();
  const [assetInfo, setAssetInfo] = useState();
  const [apiKey, setApiKey] = useState();
  const [wfProjects, setWFProjects] = useState([]);
  const [wfProjectId, setWFProjectId]= useState();
  const [wfProjectLoadingState, setWFProjectLoadingState] = useState(true);

  useEffect(() => {
    (async () => {
      const guestConnection = await attach({ id: extensionId });
      const sharedConfiguration = guestConnection.configuration;
      const assetInfo = await guestConnection.host.details.getCurrentResourceInfo();
      const auth = await guestConnection.host.auth.getIMSInfo();
      setIMSInfo(auth);
      setAssetInfo(assetInfo);
      setConfiguration(sharedConfiguration);
      setGuestConnection(guestConnection);

      const { colorScheme } = await guestConnection.host.theme.getThemeInfo();

      const headers = {};
      headers.authorization = `Bearer ${auth.accessToken}`;
      headers['x-gw-ims-org-id'] = auth.imsOrg;

      try {
        const actionResponse = await actionWebInvoke(actions["aem-assets-details-1/generic"], headers)
        const options = [];
        for (let index = 0; index < actionResponse.data.length; index++) {
          const element = actionResponse.data[index];
          element.id = index+1;
          options.push(element)
        }
        setWFProjects(options)
        console.log(options)
        setWFProjectLoadingState(false);
      } catch (e) {
        console.log(e)
      }

      setColorScheme(colorScheme);
    })()
  }, []);

  useEffect(() => {
    if (!guestConnection) {
      return;
    }

    if (!configuration) {
      setConfiguration( { WORKFRONT_INSTANCE_URL: process.env['WORKFRONT_INSTANCE_URL'], DOCUMENT_PROVIDER_ID: process.env['DOCUMENT_PROVIDER_ID'] } );
    }
  }, [guestConnection]);

  function displayToast(variant, message) {
    guestConnection.host.toast.display({ variant, message });
  }

  async function linkAsset() {
    const headers = {};
    headers.authorization = `Bearer ${IMSInfo.accessToken}`;
    headers['x-gw-ims-org-id'] = IMSInfo.imsOrg;

    const aemHost = await guestConnection.host.discovery.getAemHost();
    const assetPath = assetInfo.path.split('/').pop();
    assetPath.substr(0,assetPath.lastIndexOf('.')),assetPath.substr(assetPath.lastIndexOf('.')+1,assetPath.length)

    let params =  { fileName: assetPath.substr(0,assetPath.lastIndexOf('.')), ext: assetPath.substr(assetPath.lastIndexOf('.')+1,assetPath.length), imageID: assetInfo.id, refObjId: wfProjects[wfProjectId-1].ID, AEM_AUTHOR_HOST: aemHost, WORKFRONT_URL: configuration.WORKFRONT_INSTANCE_URL, DOCUMENT_PROVIDER_ID: configuration.DOCUMENT_PROVIDER_ID}

    try {
      const wfProjectName = wfProjects[wfProjectId-1].name;
      const paramsMetadata =  { wfProjectName: wfProjectName, assetPath: assetInfo.path, AEM_AUTHOR_HOST: aemHost}
      const metadataActionResponse = await actionWebInvoke(actions["aem-assets-details-1/metadata"], headers, paramsMetadata);
      const actionResponse = await actionWebInvoke(actions["aem-assets-details-1/link"], headers, params);
      
      const variant = 'positive';
      const message = 'Successfully linked asset'
      guestConnection.host.toast.display({ variant, message });
      
    } catch (e) {
      const variant = 'negative';
      const message = 'Error linking asset';
      guestConnection.host.toast.display({ variant, message });
      console.log(e)
    }
  }

  return (
  <Provider theme={defaultTheme} colorScheme={colorScheme} height={'100vh'}>
    <View backgroundColor="gray-50">
      <View padding="size-300">
        <Text>Select a workfront project to link the selected asset to. Only projects you have access to will be visible in the list.</Text>

        <Flex justifyContent="center" marginTop="size-400" direction='column' gap={10}>
          <ComboBox
            label="Chose a Workfront project"
            items={wfProjects}
            loadingState={wfProjectLoadingState}
            onSelectionChange={selected => setWFProjectId(selected)}
            width={300}>
            {item => <Item>{item.name}</Item>}
          </ComboBox>
          <ButtonGroup>
              <Button variant="primary" onPress={() => linkAsset()}>Link</Button>
          </ButtonGroup>
        </Flex>
      </View>
    </View>
  </Provider>
  );
}
