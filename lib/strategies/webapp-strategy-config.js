/*
 Copyright 2017 IBM Corp.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

const log4js = require("log4js");
const logger = log4js.getLogger("appid-webapp-strategy-config");

const VCAP_SERVICES = "VCAP_SERVICES";
const VCAP_SERVICES_CREDENTIALS = "credentials";
const VCAP_SERVICES_SERVICE_NAME1 = "AdvancedMobileAccess";
const VCAP_SERVICES_SERVICE_NAME2 = "AppID";
const VCAP_APPLICATION = "VCAP_APPLICATION";
const TENANT_ID = "tenantId";
const CLIENT_ID = "clientId";
const SECRET = "secret";
const OAUTH_SERVER_URL = "oauthServerUrl";
const REDIRECT_URI = "redirectUri";

module.exports = function (options) {
	logger.debug("Initializing");
	options = options || {};
	const vcapServices = JSON.parse(process.env[VCAP_SERVICES] || "{}");
	var vcapServiceCredentials = {};
	
	// Find App ID service config
	for (var propName in vcapServices) {
		// Does service name starts with AdvancedMobileAccess
		if (propName.indexOf(VCAP_SERVICES_SERVICE_NAME1) === 0 || propName.indexOf(VCAP_SERVICES_SERVICE_NAME2) === 0) {
			vcapServiceCredentials = vcapServices[propName][0][VCAP_SERVICES_CREDENTIALS];
			break;
		}
	}
	
	var serviceConfig = {};
	serviceConfig[TENANT_ID] = options[TENANT_ID] || vcapServiceCredentials[TENANT_ID];
	serviceConfig[CLIENT_ID] = options[CLIENT_ID] || vcapServiceCredentials[CLIENT_ID];
	serviceConfig[SECRET] = options[SECRET] || vcapServiceCredentials[SECRET];
	serviceConfig[OAUTH_SERVER_URL] = options[OAUTH_SERVER_URL] || vcapServiceCredentials[OAUTH_SERVER_URL];
	serviceConfig[REDIRECT_URI] = options[REDIRECT_URI] || process.env[REDIRECT_URI];
	
	if (!serviceConfig[REDIRECT_URI]) {
		var vcapApplication = process.env[VCAP_APPLICATION];
		if (vcapApplication) {
			vcapApplication = JSON.parse(vcapApplication);
			serviceConfig[REDIRECT_URI] = "https://" + vcapApplication["application_uris"][0] + "/ibm/bluemix/appid/callback";
		}
	}
	
	if (!serviceConfig[CLIENT_ID] || !serviceConfig[SECRET] || !serviceConfig[OAUTH_SERVER_URL] || !serviceConfig[TENANT_ID] || !serviceConfig[REDIRECT_URI]) {
		logger.error("Failed to initialize webapp-strategy. All requests to protected endpoints will be rejected");
		logger.error("Ensure your node.js app is either bound to an App ID service instance or pass required parameters in the strategy constructor ");
	}
	
	logger.info(TENANT_ID, serviceConfig[TENANT_ID]);
	logger.info(CLIENT_ID, serviceConfig[CLIENT_ID]);
	logger.info(SECRET, "[NOT SHOWING]");
	logger.info(OAUTH_SERVER_URL, serviceConfig[OAUTH_SERVER_URL]);
	logger.info(REDIRECT_URI, serviceConfig[REDIRECT_URI]);
	
	function getConfig() {
		return serviceConfig;
	}
	
	function getTenantId() {
		return serviceConfig[TENANT_ID];
	}
	
	function getClientId() {
		return serviceConfig[CLIENT_ID];
	}
	
	function getSecret() {
		return serviceConfig[SECRET];
	}
	
	function getOAuthServerUrl() {
		return serviceConfig[OAUTH_SERVER_URL];
	}
	
	function getRedirectUri() {
		return serviceConfig[REDIRECT_URI];
	}
	
	return {
		getConfig: getConfig,
		getTenantId: getTenantId,
		getClientId: getClientId,
		getSecret: getSecret,
		getOAuthServerUrl: getOAuthServerUrl,
		getRedirectUri: getRedirectUri
	};
};
