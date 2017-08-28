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
const logger = log4js.getLogger("appid-api-strategy-config");

const VCAP_SERVICES = "VCAP_SERVICES";
const VCAP_SERVICES_CREDENTIALS = "credentials";
const VCAP_SERVICES_SERVICE_NAME1 = "AdvancedMobileAccess";
const VCAP_SERVICES_SERVICE_NAME2 = "AppID";
const VCAP_APPLICATION = "VCAP_APPLICATION";
const OAUTH_SERVER_URL = "oauthServerUrl";

module.exports = function (options) {
	logger.debug("Initializing");
	options = options || {};
	const vcapServices = JSON.parse(process.env[VCAP_SERVICES] || "{}");
	var vcapServiceCredentials = {};
	var serviceConfig = {};

	// Find App ID service config
	for (var propName in vcapServices) {
		// Does service name starts with VCAP_SERVICES_SERVICE_NAME
		if (propName.indexOf(VCAP_SERVICES_SERVICE_NAME1) === 0||propName.indexOf(VCAP_SERVICES_SERVICE_NAME2) === 0) {
			vcapServiceCredentials = vcapServices[propName][0][VCAP_SERVICES_CREDENTIALS];
			break;
		}
	}

	serviceConfig[OAUTH_SERVER_URL] = options[OAUTH_SERVER_URL] || vcapServiceCredentials[OAUTH_SERVER_URL];

	if (!serviceConfig[OAUTH_SERVER_URL]) {
		logger.error("Failed to initialize api-strategy. All requests to protected endpoints will be rejected");
		logger.error("Ensure your node.js app is either bound to an App ID service instance or pass required parameters in the strategy constructor ");
	}

	logger.info(OAUTH_SERVER_URL, serviceConfig[OAUTH_SERVER_URL]);

	function getConfig() {
		return serviceConfig;
	}

	function getOAuthServerUrl(){
		return serviceConfig[OAUTH_SERVER_URL];
	}

	return {
		getConfig: getConfig,
		getOAuthServerUrl: getOAuthServerUrl
	};
};
