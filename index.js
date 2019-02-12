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
 * This function initializes the document repository for the Bali Nebula™.
 * 
 * @param {String} testDirectory An optional test directory to be used as a local
 * document repository.
 * @returns {Object} A singleton object containing the initialized document repository.
 */
exports.repository = function(testDirectory) {
    const repository = testDirectory ?
        require('./src/LocalRepository').repository(testDirectory) :
        require('./src/CloudRepository').repository();
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
