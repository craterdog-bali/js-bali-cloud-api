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
 * @param {String} directory A test directory to be used as a local document repository.
 * @param {Boolean} debug An optional flag that determines whether or not exceptions
 * will be logged to the error console.
 * @returns {Object} A singleton object containing the initialized document repository.
 */
exports.local = function(directory, debug) {
    const repository = require('./src/LocalRepository').repository(directory, debug);
    return repository;
};

/**
 * This function initializes a cloud based document repository for the Bali Nebula™.
 * 
 * @param {Object} notary An object that implements the digital notary API.
 * @param {Reference} cloudURL A reference that defines the URL for the cloud repository.
 * @param {Boolean} debug An optional flag that determines whether or not exceptions
 * will be logged to the error console.
 * @returns {Object} A singleton object containing the initialized document repository.
 */
exports.cloud = function(notary, cloudURL, debug) {
    const repository = require('./src/CloudRepository').repository(notary, cloudURL, debug);
    return repository;
};

/**
 * This function initializes the Bali Nebula™ API. It requires that a digital notary
 * and document repository be specified.
 * 
 * @param {Object} notary An object that implements the digital notary API.
 * @param {Object} repository An object that implements the document repository API.
 * @param {Boolean} debug An optional flag that determines whether or not exceptions
 * will be logged to the error console.
 * @returns {Object} A singleton object containing the initialized Bali Nebula™ API.
 */
exports.api = function(notary, repository, debug) {
    const api = require('./src/NebulaAPI').api(notary, repository, debug);
    return api;
};
