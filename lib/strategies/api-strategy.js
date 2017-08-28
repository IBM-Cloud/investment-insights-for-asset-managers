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
const ServiceConfig = require("./api-strategy-config");
const TokenUtil = require("./../utils/token-util");
const PublicKeyUtil = require("./../utils/public-key-util");

const ERROR = {
	INVALID_REQUEST: "invalid_request", // HTTP 400
	INVALID_TOKEN: "invalid_token", // HTTP 401
	INSUFFICIENT_SCOPE: "insufficient_scope" // HTTP 401
};

const AUTHORIZATION_HEADER = "Authorization";
const STRATEGY_NAME = "appid-api-strategy";
const BEARER = "Bearer";

const logger = log4js.getLogger(STRATEGY_NAME);

function ApiStrategy(options) {
	logger.debug("Initializing");
	options = options || {};
	this.name = ApiStrategy.STRATEGY_NAME;
	this.serviceConfig = new ServiceConfig(options);
	PublicKeyUtil.retrievePublicKey(this.serviceConfig.getOAuthServerUrl());
}

ApiStrategy.STRATEGY_NAME = STRATEGY_NAME;
ApiStrategy.DEFAULT_SCOPE = "appid_default";

ApiStrategy.prototype.authenticate = function(req, options) {
	logger.debug("authenticate");
	options = options || {};
	var requiredScope = ApiStrategy.DEFAULT_SCOPE;
	if (options.scope){
		requiredScope += " " + options.scope;
	}

	// Retrieve authorization header from request
	var authHeader = req.header(AUTHORIZATION_HEADER);
	if (!authHeader){
		logger.warn("Authorization header not found");
		return this.fail(buildWwwAuthenticateHeader(requiredScope, ERROR.INVALID_TOKEN), 401);
	}

	// Validate that first header component is Bearer
	var authHeaderComponents = authHeader.split(" ");
	if (authHeaderComponents[0].indexOf(BEARER) !== 0){
		logger.warn("Malformed authorization header");
		return this.fail(buildWwwAuthenticateHeader(requiredScope, ERROR.INVALID_TOKEN), 401);
	}

	// Validate header has exactly 2 or 3 components (Bearer, access_token, [id_token])
	if (authHeaderComponents.length !== 2 && authHeaderComponents.length !== 3){
		logger.warn("Malformed authorization header");
		return this.fail(buildWwwAuthenticateHeader(requiredScope, ERROR.INVALID_TOKEN), 401);
	}

	// Validate second header component is a valid access_token
	var accessTokenString = authHeaderComponents[1];

	// Decode and validate access_token
	var accessToken = TokenUtil.decodeAndValidate(accessTokenString);
	if (!accessToken){
		logger.warn("Invalid access_token");
		return this.fail(buildWwwAuthenticateHeader(requiredScope, ERROR.INVALID_TOKEN), 401);
	}

	// Validate token contains required scopes
	var requiredScopeElements = requiredScope.split(" ");
	var suppliedScopeElements = accessToken.scope.split(" ");
	for (var i=0; i<requiredScopeElements.length; i++){
		var requiredScopeElement = requiredScopeElements[i];
		var found = false;
		for (var j=0; j<suppliedScopeElements.length; j++){
			var suppliedScopeElement = suppliedScopeElements[j];
			if (requiredScopeElement === suppliedScopeElement){
				found = true;
				break;
			}
		}
		if (!found){
			logger.warn("access_token does not contain required scope. Expected ::", requiredScope, " Received ::", accessToken.scope);
			return this.fail(buildWwwAuthenticateHeader(requiredScope, ERROR.INSUFFICIENT_SCOPE), 401);
		}
	}

	// Decode and validate id_token
	var identityTokenString;
	var identityToken;
	if (authHeaderComponents.length === 3){
		identityTokenString = authHeaderComponents[2];
		identityToken = TokenUtil.decodeAndValidate(identityTokenString);
		if (!identityToken){
			logger.warn("Invalid identity_token. Proceeding with access_token only");
		}
	} else {
		logger.debug("identity_token not found. Proceeding with access_token only.");
	}

	req.appIdAuthorizationContext = {
		accessToken: accessTokenString,
		accessTokenPayload: accessToken
	};

	if (identityToken) {
		req.appIdAuthorizationContext.identityToken = identityTokenString;
		req.appIdAuthorizationContext.identityTokenPayload = identityToken;
	}

	return this.success(identityToken || null);

	// .success(user, info) - call on auth success. user=object, info=object
	// .fail(challenge, status) - call on auth failure. challenge=string, status=int
	// .redirect(url, status) - call on redirect required. url=url, status=int
	// .pass() - skip strategy processing
	// .error(err) - error during strategy processing. err=Error obj
};

function buildWwwAuthenticateHeader(scope, error){
	var msg = BEARER + " scope=\"" + scope + "\"";
	if (error){
		msg += ", error=\"" + error + "\"";
	}
	return msg;
}

module.exports = ApiStrategy;
