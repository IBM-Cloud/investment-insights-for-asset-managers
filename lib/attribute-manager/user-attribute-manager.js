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
const request = require("request");
const Q = require("q");
const _ = require("underscore");
const logger = log4js.getLogger("appid-user-attribute-manager");

const VCAP_SERVICES = "VCAP_SERVICES";
const VCAP_SERVICES_CREDENTIALS = "credentials";
const VCAP_SERVICES_SERVICE_NAME1 = "AdvancedMobileAccess";
const VCAP_SERVICES_SERVICE_NAME2 = "AppID";

const USER_PROFILE_SERVER_URL = "profilesUrl";
const ATTRIBUTES_ENDPOINT = "/api/v1/attributes";
function UserAttributeManager() {
}

UserAttributeManager.prototype.init = function (options) {
	options = options || {};
	
	const vcapServices = JSON.parse(process.env[VCAP_SERVICES] || "{}");
	var vcapServiceCredentials = {};
	
	// Find App ID service config
	for (var propName in vcapServices) {
		// Does service name starts with VCAP_SERVICES_SERVICE_NAME
		if (propName.indexOf(VCAP_SERVICES_SERVICE_NAME1) === 0 || propName.indexOf(VCAP_SERVICES_SERVICE_NAME2) === 0) {
			vcapServiceCredentials = vcapServices[propName][0][VCAP_SERVICES_CREDENTIALS];
			break;
		}
	}
	
	this.userProfilesServerUrl = options[USER_PROFILE_SERVER_URL] || vcapServiceCredentials[USER_PROFILE_SERVER_URL];
	if (!this.userProfilesServerUrl) {
		logger.error("Failed to initialize user-attribute-manager.");
		logger.error("Ensure your node.js app is either bound to an App ID service instance or pass required parameter to the constructor ");
	}
	logger.info(USER_PROFILE_SERVER_URL, this.userProfilesServerUrl);
};

UserAttributeManager.prototype.setAttribute = function (accessToken, attributeName, attributeValue) {
	const deferred = Q.defer();
	if (!_.isString(accessToken) || !_.isString(attributeName) || !_.isString(attributeValue)) {
		logger.error("setAttribute invalid invocation parameters");
		return Q.reject();
	}
	var profilesUrl = this.userProfilesServerUrl + ATTRIBUTES_ENDPOINT + "/" + attributeName;
	handleRequest(accessToken, attributeValue, "PUT", profilesUrl, "setAttribute", deferred);
	return deferred.promise;
};

UserAttributeManager.prototype.getAttribute = function (accessToken, attributeName) {
	const deferred = Q.defer();
	if (!_.isString(accessToken) || !_.isString(attributeName)) {
		logger.error("getAttribute invalid invocation parameters");
		return Q.reject();
	}
	logger.debug("Getting attribute ", attributeName);
	var profilesUrl = this.userProfilesServerUrl + ATTRIBUTES_ENDPOINT + "/" + attributeName;
	handleRequest(accessToken, null, "GET", profilesUrl, "getAttribute", deferred);
	return deferred.promise;
	
};

UserAttributeManager.prototype.deleteAttribute = function (accessToken, attributeName) {
	const deferred = Q.defer();
	if (!_.isString(accessToken) || !_.isString(attributeName)) {
		logger.error("deleteAttribute invalid invocation parameters");
		return Q.reject();
	}
	logger.debug("Deleting attribute", attributeName);
	var profilesUrl = this.userProfilesServerUrl + ATTRIBUTES_ENDPOINT + "/" + attributeName;
	handleRequest(accessToken, null, "DELETE", profilesUrl, "deleteAttribute", deferred);
	return deferred.promise;
	
};


UserAttributeManager.prototype.getAllAttributes = function (accessToken) {
	const deferred = Q.defer();
	if (!_.isString(accessToken)) {
		logger.error("getAllAttributes invalid invocation parameters");
		return Q.reject();
	}
	logger.debug("Getting all attributes");
	var profilesUrl = this.userProfilesServerUrl + ATTRIBUTES_ENDPOINT;
	handleRequest(accessToken, null, "GET", profilesUrl, "getAllAttributes", deferred);
	return deferred.promise;
};

function handleRequest(accessToken, attributeValue, method, url, action, deferred) {
	
	request({
		url: url,
		method: method,
		body: attributeValue,
		headers: {
			"Authorization": "Bearer " + accessToken
		}
	}, function (err, response, body) {
		if (err) {
			logger.error(err);
			return deferred.reject(new Error("Failed to " + action));
		} else if (response.statusCode === 401 || response.statusCode === 403) {
			return deferred.reject(new Error("Unauthorized"));
		} else if (response.statusCode === 404) {
			return deferred.reject(new Error("Not found"));
		} else if (response.statusCode >= 200 && response.statusCode < 300) {
			return deferred.resolve(body ? JSON.parse(body) : null);
		} else {
			logger.error(err, response.headers);
			return deferred.reject(new Error("Unexpected error"));
		}
	});
}

module.exports = new UserAttributeManager();
