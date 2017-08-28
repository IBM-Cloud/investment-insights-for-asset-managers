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
const logger = log4js.getLogger("appid-public-key-util");
const Q = require("q");
const request = require("request");
const pemFromModExp = require("rsa-pem-from-mod-exp");

const PUBLIC_KEY_PATH = "/publickey";
const TIMEOUT = 15 * 1000;

module.exports = (function(){
	logger.debug("Initializing");
	var publicKeyJson = null;

	function retrievePublicKey(serverUrl){
		serverUrl = serverUrl + PUBLIC_KEY_PATH;
		logger.debug("Getting public key from", serverUrl);
		var deferred = Q.defer();
		request({
			method: "GET",
			url: serverUrl,
			json: true,
			timeout: TIMEOUT
		}, function (error, response, body){
			if (error || response.statusCode !== 200){
				logger.error("Failed to retrieve public key. All requests to protected endpoints will be rejected.");
				return deferred.reject("Failed to retrieve public key");
			} else {
				publicKeyJson = body;
				logger.info("Public key retrieved");
				return deferred.resolve();
			}
		});
		return deferred.promise;
	}

	function getPublicKeyPem(){
		if (publicKeyJson){
			return pemFromModExp(publicKeyJson.n, publicKeyJson.e);
		} else {
			logger.warn("Public key not found. All requests to protected endpoints will be rejected.");
		}
	}

	return {
		retrievePublicKey: retrievePublicKey,
		getPublicKeyPem: getPublicKeyPem
	};
}());