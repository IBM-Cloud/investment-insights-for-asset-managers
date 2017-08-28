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

const Log4js = require("log4js");
const APIStrategy = require("./strategies/api-strategy");
const WebAppStrategy = require("./strategies/webapp-strategy");
const UserAttributeManager = require("./attribute-manager/user-attribute-manager");

const logger = Log4js.getLogger("appid-sdk");
logger.info("Initialized");

module.exports = {
	APIStrategy: APIStrategy,
	WebAppStrategy: WebAppStrategy,
	UserAttributeManager: UserAttributeManager
};



