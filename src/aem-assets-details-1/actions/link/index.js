/*
* <license header>
*/

/**
 * This is a sample action showcasing how to access an external API
 *
 * Note:
 * You might want to disable authentication and authorization checks against Adobe Identity Management System for a generic action. In that case:
 *   - Remove the require-adobe-auth annotation for this action in the manifest.yml of your application
 *   - Remove the Authorization header from the array passed in checkMissingRequestInputs
 *   - The two steps above imply that every client knowing the URL to this deployed action will be able to invoke it without any authentication and authorization checks against Adobe Identity Management System
 *   - Make sure to validate these changes against your security requirements before deploying the action
 */


const fetch = require('node-fetch')
const { Core } = require('@adobe/aio-sdk')
const { errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs } = require('../utils')

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    // 'info' is the default level if not set
    logger.info('Calling the main action')

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.debug(stringParameters(params))

    // check for missing request input parameters and headers
    const requiredParams = [/* add required params */]
    const requiredHeaders = ['Authorization']
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger)
    }

    // extract the user Bearer token from the Authorization header
    const token = getBearerToken(params)

    const fileName = params.fileName;
    const ext = params.ext;
    const imageID = params.imageID;
    const refObjId = params.refObjId;

    const apiEndpoint = params.WORKFRONT_URL+"/attask/api/v19.0/extdoc?&action=linkExternalDocumentObjects";

    const { hostname } = new URL(params.AEM_AUTHOR_HOST);

    // replace this with the api you want to access
    const objectCode = "urn:workfront:documents:aem:"+hostname+":" + encodeURIComponent(imageID);
    const objects = {};
    objects[objectCode] = {
      "ID":"urn:workfront:documents:aem:"+hostname+":" + encodeURIComponent(imageID),
      "name":fileName,
      "ext":ext,
      "isFolder":false}
    const res = await fetch(apiEndpoint, {
      method: 'PUT',
      headers: {
          'Authorization': 'Bearer ' + token,
          'content-type': 'application/json'
      },
      body: JSON.stringify({
        "refObjCode": 'PROJ',
        "refObjID": refObjId,
        "providerType": "AEM",
        "documentProviderID": "66020ca100113634b069d52f629515dc",
        "objects": JSON.stringify(objects)
      })
    });
    if (!res.ok) {
      throw new Error('request to ' + apiEndpoint + ' failed with status code ' + res.status)
    }
    const content = await res.json()
    const response = {
      statusCode: 200,
      body: content
    }

    // log the response status code
    logger.info(`${response.statusCode}: successful request`)
    return response
  } catch (error) {
    // log any server errors
    logger.error(error)
    // return with 500
    return errorResponse(500, 'server error', logger)
  }
}

exports.main = main