/************************************************************************
 * Copyright (c) Crater Dog Technologies(TM).  All Rights Reserved.     *
 ************************************************************************
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.        *
 *                                                                      *
 * This code is free software; you can redistribute it and/or modify it *
 * under the terms of The MIT License (MIT), as published by the Open   *
 * Source Initiative. (See http://opensource.org/licenses/MIT)          *
 ************************************************************************/
'use strict';

/**
 * This function initializes a test document repository for the Bali Nebula™.
 * 
 * @param {String} testDirectory A test directory to be used as a local document repository.
 * @returns {Object} A singleton object containing the initialized document repository.
 */
exports.local = function(testDirectory) {
    const repository = require('./src/LocalRepository').repository(testDirectory);
    return repository;
};

/**
 * This function initializes a cloud based document repository for the Bali Nebula™.
 * 
 * @param {Object} notary An object that implements the digital notary API.
 * @param {String|URL} cloudURL An object that defines the URL for the cloud repository.
 * @returns {Object} A singleton object containing the initialized document repository.
 */
exports.cloud = function(notary, cloudURL) {
    const repository = require('./src/CloudRepository').repository(notary, cloudURL);
    return repository;
};

/**
 * This function initializes the Bali Nebula™ API. It requires that a digital notary
 * and document repository be specified.
 * 
 * @param {Object} notary An object that implements the digital notary API.
 * @param {Object} repository An object that implements the document repository API.
 * @returns {Object} A singleton object containing the initialized Bali Nebula™ API.
 */
exports.api = function(notary, repository) {
    const api = require('./src/NebulaAPI').api(notary, repository);
    return api;
};
